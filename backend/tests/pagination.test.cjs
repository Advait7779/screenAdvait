const test = require('node:test');
const assert = require('node:assert/strict');
const { SubscriptionService } = require('../dist/src/subscriptions/subscription.service.js');
const { CompanyAdminService } = require('../dist/src/company-admin/company-admin.service.js');
const { ScreenshotService } = require('../dist/src/screenshots/screenshot.service.js');
const { parsePage, parsePageSize } = require('../dist/src/common/pagination.js');

test('pagination rejects invalid and oversized requests', () => {
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePageSize(undefined), 10);
  assert.equal(parsePageSize('30', 30), 30);
  assert.throws(() => parsePage('0'), /page must be/);
  assert.throws(() => parsePage('1.5'), /page must be/);
  assert.throws(() => parsePageSize('101'), /pageSize must be/);
});

test('subscription page enriches only selected rows with grouped usage', async () => {
  const calls = [];
  const prisma = {
    subscription: {
      count: async () => 32,
      findMany: async (args) => {
        calls.push(['findMany', args]);
        return [
          { id: 'sub-11', companyId: 'company-1', company: { id: 'company-1', name: 'One' } },
          { id: 'sub-12', companyId: 'company-2', company: { id: 'company-2', name: 'Two' } },
        ];
      },
    },
    user: {
      groupBy: async (args) => {
        calls.push(['employees', args]);
        return [{ companyId: 'company-1', _count: { _all: 4 } }];
      },
    },
    license: {
      groupBy: async (args) => {
        calls.push(['allocations', args]);
        return [{ subscriptionId: 'sub-12', _sum: { maxDevices: 7 } }];
      },
    },
  };
  const result = await new SubscriptionService(prisma).getPage(2, 10);
  assert.equal(calls[0][1].skip, 10);
  assert.equal(calls[0][1].take, 10);
  assert.deepEqual(calls[1][1].where.companyId.in, ['company-1', 'company-2']);
  assert.deepEqual(calls[2][1].where.subscriptionId.in, ['sub-11', 'sub-12']);
  assert.deepEqual(result.items.map((item) => item.usage), [
    { employees: 4, allocatedDeviceSlots: 0 },
    { employees: 0, allocatedDeviceSlots: 7 },
  ]);
  assert.equal(result.total, 32);
});

test('employee page is scoped to its company before pagination', async () => {
  let listQuery;
  const prisma = {
    user: {
      count: async ({ where }) => {
        assert.deepEqual(where, { companyId: 'company-1', role: 'EMPLOYEE' });
        return 21;
      },
      findMany: async (args) => {
        listQuery = args;
        return [{ id: 'employee-11', licenses: [] }];
      },
    },
  };
  const result = await new CompanyAdminService(prisma, {}, {}).getEmployeePage('company-1', 2, 10);
  assert.deepEqual(listQuery.where, { companyId: 'company-1', role: 'EMPLOYEE' });
  assert.equal(listQuery.skip, 10);
  assert.equal(listQuery.take, 10);
  assert.equal(listQuery.select.licenses.take, 1);
  assert.equal(result.total, 21);
});

test('screenshot day listing returns numeric counts without exposing other companies', async () => {
  const queries = [];
  const prisma = {
    $queryRaw: async (strings, ...values) => {
      queries.push({ sql: strings.join('?'), values });
      return queries.length === 1
        ? [{ days: 9n, screenshots: 73n }]
        : [{ key: '2026-10-30', capturedAt: new Date('2026-10-30T08:00:00Z'), screenshotCount: 12n, employeeCount: 3n }];
    },
  };
  const result = await new ScreenshotService(prisma, {}, {}).getCompanyDays('company-1', 2, 5, 'capture', 'Asia/Calcutta');
  assert.equal(result.totalDays, 9);
  assert.equal(result.totalScreenshots, 73);
  assert.equal(result.items[0].screenshotCount, 12);
  assert.equal(result.items[0].employeeCount, 3);
  for (const query of queries) {
    assert.match(query.sql, /s\."companyId" =/);
    assert.match(query.sql, /AT TIME ZONE 'UTC'/);
    assert.ok(query.values.includes('company-1'));
  }
});

test('searched screenshot pages stay within the company and return a continuation cursor', async () => {
  const queries = [];
  const prisma = {
    $queryRaw: async (strings, ...values) => {
      const sql = strings.join('?');
      queries.push({ sql, values });
      if (sql.includes('AS start')) {
        return [{ start: new Date('2026-10-29T18:30:00Z'), end: new Date('2026-10-30T18:30:00Z') }];
      }
      return [
        { id: 'shot-2', companyId: 'company-1', userId: 'user-1', fileName: 'capture-2.png', fileSize: 10n, capturedAt: new Date(), username: 'alice', fullName: 'Alice A' },
        { id: 'shot-1', companyId: 'company-1', userId: 'user-1', fileName: 'capture-1.png', fileSize: 10n, capturedAt: new Date(), username: 'alice', fullName: 'Alice A' },
      ];
    },
  };
  const result = await new ScreenshotService(prisma, {}, {}).getCompanyScreenshots(
    'company-1', undefined, 1, { day: '2026-10-30', search: 'alice', timeZone: 'Asia/Calcutta' },
  );
  assert.equal(result.items.length, 1);
  assert.equal(result.nextCursor, 'shot-2');
  assert.equal(result.items[0].fileSize, 10);
  assert.equal(result.items[0].user.username, 'alice');
  assert.match(queries[1].sql, /s\."companyId" =/);
  assert.ok(queries[1].values.includes('company-1'));
  assert.ok(queries[1].values.includes('alice'));
});
