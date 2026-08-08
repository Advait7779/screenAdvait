const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEnvironment } = require('../dist/src/config/validate-env.js');

const valid = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@postgres:5432/screenadvait',
  JWT_SECRET: 'access_9WmJ2kN7qR4tV8xZ1cF6hL3pS5dG0bY',
  JWT_REFRESH_SECRET: 'refresh_2Cx8vB4nM7qK1wR9fT5zJ3hL6pS0dG',
  CORS_ORIGINS: 'https://portal.example.com',
  STORAGE_PROVIDER: 'local',
};

test('production environment accepts explicit HTTPS and unique secrets', () => {
  const result = validateEnvironment(valid);
  assert.equal(result.NODE_ENV, 'production');
  assert.equal(result.STORAGE_PROVIDER, 'local');
});

test('production environment rejects HTTP origins and duplicate secrets', () => {
  assert.throws(
    () => validateEnvironment({ ...valid, CORS_ORIGINS: 'http://portal.example.com' }),
    /HTTPS origins/,
  );
  assert.throws(
    () => validateEnvironment({ ...valid, JWT_REFRESH_SECRET: valid.JWT_SECRET }),
    /must be different/,
  );
});

test('environment rejects unsupported storage providers', () => {
  assert.throws(
    () => validateEnvironment({ ...valid, STORAGE_PROVIDER: 'unknown' }),
    /STORAGE_PROVIDER/,
  );
});

test('demo seeding is opt-in and requires separate strong passwords', () => {
  assert.equal(validateEnvironment(valid).AUTO_SEED, false);
  assert.throws(
    () => validateEnvironment({ ...valid, AUTO_SEED: 'true' }),
    /AUTO_SEED requires/,
  );
  const seeded = validateEnvironment({
    ...valid,
    AUTO_SEED: 'true',
    SUPERADMIN_PASSWORD: 'Admin-Password-2026!',
    SEED_DEMO_PASSWORD: 'Demo-Password-2026!',
  });
  assert.equal(seeded.AUTO_SEED, true);
});
