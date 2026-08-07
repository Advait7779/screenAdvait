import { z } from 'zod';
import { UserRole, LicensePlan } from '@screenadvait/shared-types';

export const LoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  licenseKey: z.string().min(1, 'License key is required'),
  rememberMe: z.boolean().optional().default(true),
  deviceId: z.string().optional(),
  machineGuid: z.string().optional(),
  os: z.string().optional(),
  computerName: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const PortalLoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type PortalLoginInput = z.infer<typeof PortalLoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters'),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const CreateCompanySchema = z.object({
  name: z.string().min(2, 'Company name required'),
  code: z.string().min(2, 'Company code required').toUpperCase(),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  maxUsers: z.number().int().positive().default(10),
  adminUsername: z.string().min(3, 'Admin username must be at least 3 characters').optional(),
  adminPassword: z.string().min(6, 'Admin password must be at least 6 characters').optional(),
});

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;

export const CreateUserSchema = z.object({
  companyId: z.string().uuid('Valid company ID required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name required'),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const CreateManagedEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: ChangePasswordSchema.shape.newPassword,
  fullName: z.string().min(2, 'Full name required'),
});

export type CreateManagedEmployeeInput = z.infer<typeof CreateManagedEmployeeSchema>;

export const EmployeeStatusSchema = z.object({
  isActive: z.boolean(),
});

export const ResetEmployeePasswordSchema = z.object({
  newPassword: ChangePasswordSchema.shape.newPassword,
});

export const CreateEmployeeLicenseSchema = z.object({
  maxDevices: z.number().int().min(1).max(20).default(1),
});

export type CreateEmployeeLicenseInput = z.infer<typeof CreateEmployeeLicenseSchema>;

export const GenerateLicenseSchema = z.object({
  companyId: z.string().uuid('Valid company ID required'),
  userId: z.string().uuid().optional(),
  plan: z.nativeEnum(LicensePlan).default(LicensePlan.MONTHLY),
  maxDevices: z.number().int().positive().default(1),
  customExpiryDays: z.number().int().positive().optional(),
});

export type GenerateLicenseInput = z.infer<typeof GenerateLicenseSchema>;

export const UpsertCompanySubscriptionSchema = z.object({
  companyId: z.string().uuid('Valid company ID required'),
  plan: z.nativeEnum(LicensePlan).default(LicensePlan.MONTHLY),
  maxEmployees: z.number().int().min(1).max(10000),
  maxDevices: z.number().int().min(1).max(50000),
  customExpiryDays: z.number().int().min(1).max(36500).optional(),
});

export type UpsertCompanySubscriptionInput = z.infer<typeof UpsertCompanySubscriptionSchema>;

export const SubscriptionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'REVOKED']),
});

export type SubscriptionStatusInput = z.infer<typeof SubscriptionStatusSchema>;

export const RenewLicenseSchema = z.object({
  days: z.number().int().min(1).max(3650).default(30),
});

export type RenewLicenseInput = z.infer<typeof RenewLicenseSchema>;

export const VerifyLicenseSchema = z.object({
  licenseKey: z.string().min(1),
  deviceId: z.string().min(8),
  machineGuid: z.string().min(16),
});

export const ScreenshotUploadMetadataSchema = z.object({
  deviceId: z.string().min(8),
  capturedAt: z.string().datetime(),
  idempotencyKey: z.string().min(16).max(200),
  timezoneOffsetMinutes: z.coerce.number().int().min(-840).max(840),
});
