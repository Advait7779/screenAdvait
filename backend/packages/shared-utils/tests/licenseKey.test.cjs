const test = require('node:test');
const assert = require('node:assert/strict');
const { generateLicenseKey, validateLicenseKeyFormat } = require('../dist/licenseKey.js');

test('generated license keys use the expected unambiguous format', () => {
  const keys = new Set();
  for (let index = 0; index < 1_000; index += 1) {
    const key = generateLicenseKey();
    assert.equal(validateLicenseKeyFormat(key), true);
    assert.equal(/[01IO]/.test(key.slice(4)), false);
    keys.add(key);
  }
  assert.equal(keys.size, 1_000);
});

test('license key validation rejects malformed values', () => {
  assert.equal(validateLicenseKeyFormat('ATS-1234'), false);
  assert.equal(validateLicenseKeyFormat(''), false);
});
