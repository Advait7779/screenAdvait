const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { deviceBindingMatches } = require('../dist/src/auth/device-binding.js');
const { CompanyService } = require('../dist/src/companies/company.service.js');
const {
  ScreenshotRetentionService,
} = require('../dist/src/screenshots/screenshot-retention.service.js');
const {
  provisionSuperAdmin,
} = require('../dist/src/scripts/provision-superadmin.js');

test('device activation cannot move between employees, licenses, or machines', () => {
  const existing = {
    userId: 'employee-1',
    licenseId: 'license-1',
    machineGuid: 'machine-guid-1',
  };
  assert.equal(deviceBindingMatches(existing, existing), true);
  assert.equal(
    deviceBindingMatches(existing, { ...existing, userId: 'employee-2' }),
    false,
  );
  assert.equal(
    deviceBindingMatches(existing, { ...existing, licenseId: 'license-2' }),
    false,
  );
  assert.equal(
    deviceBindingMatches(existing, { ...existing, machineGuid: 'machine-guid-2' }),
    false,
  );
});

test('company deletion aborts before database deletion when screenshot cleanup fails', async () => {
  let transactionStarted = false;
  const prisma = {
    company: {
      findUnique: async () => ({
        id: 'company-1',
        name: 'Example Company',
        code: 'EXAMPLE',
        _count: { users: 1, licenses: 1, screenshots: 1, subscriptions: 1 },
      }),
    },
    screenshot: {
      findMany: async () => [{ fileKey: 'local:company/file.png', driveFileId: null }],
    },
    $transaction: async () => {
      transactionStarted = true;
    },
  };
  const storage = {
    deleteFile: async () => {
      throw new Error('disk unavailable');
    },
  };
  const service = new CompanyService(prisma, storage);
  await assert.rejects(
    () => service.deleteCompany('company-1', 'admin-1'),
    /Could not remove all company screenshot files/,
  );
  assert.equal(transactionStarted, false);
});

test('screenshot retention defaults to 15 days and deletes file before its row', async () => {
  delete process.env.SCREENSHOT_RETENTION_DAYS;
  const operations = [];
  let cutoff;
  const prisma = {
    screenshot: {
      findMany: async ({ where }) => {
        cutoff = where.capturedAt.lt;
        return [
          {
            id: 'screenshot-1',
            companyId: 'company-1',
            fileKey: 'local:company/file.png',
            driveFileId: null,
          },
        ];
      },
      delete: async () => operations.push('database'),
    },
  };
  const storage = { deleteFile: async () => operations.push('file') };
  const service = new ScreenshotRetentionService(prisma, storage);
  const now = new Date('2026-08-08T12:00:00.000Z');
  const deleted = await service.cleanupExpiredScreenshots(now);

  assert.equal(deleted, 1);
  assert.equal(cutoff.toISOString(), '2026-07-24T12:00:00.000Z');
  assert.deepEqual(operations, ['file', 'database']);
});

test('portal authentication contains no hardcoded superadmin master password', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/auth/auth.service.ts'),
    'utf8',
  );
  assert.doesNotMatch(source, /SuperAdmin@2026!/);
  assert.doesNotMatch(source, /defaultPassword/);
});

test('demo seeding is explicit and preserves passwords on existing accounts', () => {
  const startupSeed = fs.readFileSync(
    path.resolve(__dirname, '../src/prisma/prisma.service.ts'),
    'utf8',
  );
  const manualSeed = fs.readFileSync(
    path.resolve(__dirname, '../prisma/seed.ts'),
    'utf8',
  );
  assert.match(startupSeed, /process\.env\.AUTO_SEED === 'true'/);
  assert.match(manualSeed, /process\.env\.AUTO_SEED !== 'true'/);
  assert.doesNotMatch(startupSeed, /SuperAdmin@2026!/);
  assert.doesNotMatch(manualSeed, /SuperAdmin@2026!/);
  assert.doesNotMatch(startupSeed, /update:\s*\{\s*passwordHash/);
  assert.doesNotMatch(manualSeed, /update:\s*\{\s*passwordHash/);
});

test('SuperAdmin provisioning creates an independent active account without demo data', async () => {
  let createdData;
  const client = {
    user: {
      findMany: async () => [],
      create: async ({ data }) => {
        createdData = data;
        return { id: 'admin-1', username: data.username, email: data.email };
      },
      update: async () => assert.fail('an absent SuperAdmin must be created'),
    },
    $transaction: async (callback) => callback(client),
  };

  const result = await provisionSuperAdmin(
    client,
    {
      username: 'superadmin',
      email: 'ADMIN@EXAMPLE.COM',
      password: 'secure-password',
    },
    async () => 'hashed-password',
  );

  assert.equal(result.created, true);
  assert.equal(createdData.companyId, null);
  assert.equal(createdData.email, 'admin@example.com');
  assert.equal(createdData.passwordHash, 'hashed-password');
  assert.equal(createdData.role, 'SUPER_ADMIN');
  assert.equal(createdData.isActive, true);
});

test('SuperAdmin provisioning resets an existing account and invalidates its sessions', async () => {
  let updateData;
  const client = {
    user: {
      findMany: async () => [
        { id: 'admin-1', username: 'superadmin', email: 'old@example.com' },
      ],
      create: async () => assert.fail('an existing SuperAdmin must be updated'),
      update: async ({ where, data }) => {
        assert.equal(where.id, 'admin-1');
        updateData = data;
        return { id: where.id, username: data.username, email: data.email };
      },
    },
    $transaction: async (callback) => callback(client),
  };

  const result = await provisionSuperAdmin(
    client,
    {
      username: 'superadmin',
      email: 'new@example.com',
      password: 'new-password',
    },
    async () => 'new-hash',
  );

  assert.equal(result.created, false);
  assert.equal(updateData.passwordHash, 'new-hash');
  assert.deepEqual(updateData.tokenVersion, { increment: 1 });
  assert.equal(updateData.role, 'SUPER_ADMIN');
  assert.equal(updateData.isActive, true);
});

test('SuperAdmin provisioning refuses ambiguous username and email ownership', async () => {
  const client = {
    user: {
      findMany: async () => [
        { id: 'admin-1', username: 'superadmin', email: 'first@example.com' },
        { id: 'admin-2', username: 'someone-else', email: 'admin@example.com' },
      ],
      create: async () => assert.fail('conflicting accounts must not be changed'),
      update: async () => assert.fail('conflicting accounts must not be changed'),
    },
    $transaction: async (callback) => callback(client),
  };

  await assert.rejects(
    () =>
      provisionSuperAdmin(
        client,
        {
          username: 'superadmin',
          email: 'admin@example.com',
          password: 'new-password',
        },
        async () => 'new-hash',
      ),
    /belong to different users/,
  );
});
