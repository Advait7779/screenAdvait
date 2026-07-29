import { UserRole } from './enums.js';

export interface IUser {
  id: string;
  companyId: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICompany {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone?: string;
  maxUsers: number;
  maxStorageMb: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
  company: ICompany;
  licenseStatus: {
    key: string;
    status: string;
    expiryDate: string;
    maxDevices: number;
    currentDevices: number;
  };
}
