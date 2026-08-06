import { LicensePlan, LicenseStatus } from './enums.js';

export interface ILicense {
  id: string;
  key: string;
  companyId: string;
  userId?: string;
  plan: LicensePlan;
  status: LicenseStatus;
  maxDevices: number;
  currentDevices: number;
  issueDate: string;
  expiryDate: string;
  renewalDate?: string;
  lastVerification?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDevice {
  id: string;
  userId: string;
  licenseId: string;
  deviceId: string;
  machineGuid: string;
  os: string;
  computerName: string;
  ipAddress?: string;
  activatedAt: string;
  lastSeenAt: string;
}

export interface ILicenseVerificationRequest {
  licenseKey: string;
  deviceId: string;
  machineGuid: string;
  os: string;
  computerName: string;
}

export interface ILicenseVerificationResponse {
  valid: boolean;
  status: LicenseStatus;
  expiryDate: string;
  remainingDays: number;
  maxDevices: number;
  currentDevices: number;
  message?: string;
}
