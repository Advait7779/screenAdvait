const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ChangePasswordSchema,
  CreateCompanySchema,
  CreateManagedEmployeeSchema,
  ScreenshotUploadMetadataSchema,
  UpsertCompanySubscriptionSchema,
} = require('../dist/validators.js');

test('employee and password schemas enforce a strong 12-character password', () => {
  assert.equal(
    CreateManagedEmployeeSchema.safeParse({
      email: 'employee@example.com',
      username: 'employee',
      password: 'password',
      fullName: 'Test Employee',
    }).success,
    false,
  );
  assert.equal(
    ChangePasswordSchema.safeParse({
      currentPassword: 'OldPassword1!',
      newPassword: 'NewPassword2!',
    }).success,
    true,
  );
});

test('storage limits are not accepted from portal onboarding requests', () => {
  const company = CreateCompanySchema.parse({
    name: 'Example Company',
    code: 'EXAMPLE',
    contactEmail: 'admin@example.com',
    maxUsers: 25,
    maxStorageMb: 999999,
  });
  assert.equal('maxStorageMb' in company, false);

  const subscription = UpsertCompanySubscriptionSchema.parse({
    companyId: '55ad9595-cfeb-4b17-9d09-194458f60670',
    plan: 'MONTHLY',
    maxEmployees: 25,
    maxDevices: 25,
    maxStorageMb: 999999,
  });
  assert.equal('maxStorageMb' in subscription, false);
});

test('screenshot metadata has bounded timezone and idempotency fields', () => {
  const valid = {
    deviceId: 'device-123456',
    capturedAt: new Date().toISOString(),
    idempotencyKey: 'capture-1234567890',
    timezoneOffsetMinutes: 330,
  };
  assert.equal(ScreenshotUploadMetadataSchema.safeParse(valid).success, true);
  assert.equal(
    ScreenshotUploadMetadataSchema.safeParse({
      ...valid,
      timezoneOffsetMinutes: 1000,
    }).success,
    false,
  );
});
