const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { deviceBindingMatches } = require('../dist/src/auth/device-binding.js');
const { CompanyService } = require('../dist/src/companies/company.service.js');
const {
  ScreenshotRetentionService,
} = require('../dist/src/screenshots/screenshot-retention.service.js');

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
