const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/main/auth-retry.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
new Function('module', 'exports', compiled)(helperModule, helperModule.exports);
const { requestWithTokenRefresh } = helperModule.exports;

test('an expired access token retries the status request with the refreshed token', async () => {
  const attempts = [];
  const result = await requestWithTokenRefresh(
    async (token) => {
      attempts.push(token);
      if (token === 'expired') throw { response: { status: 401 } };
      return { active: true };
    },
    'expired',
    async () => 'renewed',
  );
  assert.deepEqual(attempts, ['expired', 'renewed']);
  assert.deepEqual(result, { active: true });
});

test('a temporary refresh failure leaves the session decision to the caller', async () => {
  const result = await requestWithTokenRefresh(
    async () => { throw { response: { status: 401 } }; },
    'expired',
    async () => null,
  );
  assert.equal(result, null);
});

test('a second unauthorized response is not retried indefinitely', async () => {
  let calls = 0;
  await assert.rejects(
    () => requestWithTokenRefresh(
      async () => {
        calls += 1;
        throw { response: { status: 401 } };
      },
      'expired',
      async () => 'renewed',
    ),
    (error) => error.response.status === 401,
  );
  assert.equal(calls, 2);
});
