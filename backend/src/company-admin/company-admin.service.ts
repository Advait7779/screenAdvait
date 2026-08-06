import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LicenseStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  CreateEmployeeLicenseInput,
  CreateManagedEmployeeInput,
  generateLicenseKey,
} from '@screenadvait/shared-utils';
import { EntitlementService } from '../entitlements/entitlement.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { google } from 'googleapis';
import { encryptText, decryptText } from '../common/crypto.util.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class CompanyAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
    private readonly mail: MailService,
  ) {}

  async overview(companyId: string) {
    const subscription = await this.entitlements.getCurrentSubscription(companyId);
    const [employees, storage] = await Promise.all([
      this.prisma.user.findMany({
        where: { companyId, role: Role.EMPLOYEE },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          isActive: true,
          createdAt: true,
          licenses: {
            select: {
              id: true,
              key: true,
              status: true,
              maxDevices: true,
              currentDevices: true,
              expiryDate: true,
              subscriptionId: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.screenshot.aggregate({
        where: { companyId },
        _sum: { fileSize: true },
      }),
    ]);
    const deviceSlots = employees.reduce(
      (total, employee) =>
        total +
        employee.licenses
          .filter((license) => license.status !== LicenseStatus.REVOKED)
          .reduce((sum, license) => sum + license.maxDevices, 0),
      0,
    );
    return {
      subscription: subscription
        ? { ...subscription, maxStorageMb: Number(subscription.maxStorageMb) }
        : null,
      usage: {
        employees: employees.length,
        allocatedDeviceSlots: deviceSlots,
        storageMb: Number(storage._sum.fileSize || BigInt(0)) / 1024 / 1024,
      },
      employees,
    };
  }

  async createEmployee(
    companyId: string,
    adminUserId: string,
    input: CreateManagedEmployeeInput,
  ) {
    const subscription = await this.entitlements.assertCompanyActive(companyId);
    const [currentEmployees, allocation] = await Promise.all([
      this.prisma.user.count({
        where: { companyId, role: Role.EMPLOYEE },
      }),
      this.prisma.license.aggregate({
        where: {
          subscriptionId: subscription.id,
          status: { not: LicenseStatus.REVOKED },
        },
        _sum: { maxDevices: true },
      }),
    ]);
    if (currentEmployees >= subscription.maxEmployees) {
      throw new ForbiddenException(
        `Employee limit reached (${subscription.maxEmployees})`,
      );
    }
    if ((allocation._sum.maxDevices || 0) + 1 > subscription.maxDevices) {
      throw new ForbiddenException(
        `Company device allocation limit reached (${subscription.maxDevices})`,
      );
    }
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: input.username }, { email: input.email }] },
    });
    if (existing) throw new ConflictException('Username or email already exists');

    const passwordHash = await bcrypt.hash(input.password, 12);
    let key = generateLicenseKey('ATS');
    while (await this.prisma.license.findUnique({ where: { key }, select: { id: true } })) {
      key = generateLicenseKey('ATS');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          companyId,
          username: input.username,
          email: input.email,
          fullName: input.fullName,
          passwordHash,
          role: Role.EMPLOYEE,
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      const license = await tx.license.create({
        data: {
          key,
          companyId,
          subscriptionId: subscription.id,
          userId: created.id,
          plan: subscription.plan,
          status: LicenseStatus.ACTIVE,
          maxDevices: 1,
          issueDate: new Date(),
          expiryDate: subscription.endDate,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: 'EMPLOYEE_CREATED',
          entity: 'User',
          entityId: created.id,
        },
      });

      return { ...created, licenseKey: license.key };
    });

    // Send welcome email — fire and forget (never blocks response)
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    void this.mail.sendWelcomeEmail({
      to: user.email,
      fullName: user.fullName,
      username: user.username,
      password: input.password,
      licenseKey: user.licenseKey,
      companyName: company?.name ?? 'Your Company',
    });

    return user;
  }

  async createEmployeeLicense(
    companyId: string,
    adminUserId: string,
    employeeId: string,
    input: CreateEmployeeLicenseInput,
  ) {
    const subscription = await this.entitlements.assertCompanyActive(companyId);
    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, companyId, role: Role.EMPLOYEE, isActive: true },
    });
    if (!employee) throw new NotFoundException('Active employee not found');

    const existing = await this.prisma.license.findFirst({
      where: {
        userId: employeeId,
        subscriptionId: subscription.id,
        status: { in: [LicenseStatus.ACTIVE, LicenseStatus.SUSPENDED] },
      },
    });
    if (existing) {
      throw new ConflictException('Employee already has a usable license key');
    }

    const allocation = await this.prisma.license.aggregate({
      where: {
        subscriptionId: subscription.id,
        status: { not: LicenseStatus.REVOKED },
      },
      _sum: { maxDevices: true },
    });
    if ((allocation._sum.maxDevices || 0) + input.maxDevices > subscription.maxDevices) {
      throw new ForbiddenException(
        `Company device limit exceeded (${subscription.maxDevices})`,
      );
    }

    let key = generateLicenseKey('ATS');
    while (await this.prisma.license.findUnique({ where: { key }, select: { id: true } })) {
      key = generateLicenseKey('ATS');
    }
    const license = await this.prisma.$transaction(async (tx) => {
      const created = await tx.license.create({
        data: {
          key,
          companyId,
          subscriptionId: subscription.id,
          userId: employeeId,
          plan: subscription.plan,
          status: LicenseStatus.ACTIVE,
          maxDevices: input.maxDevices,
          issueDate: new Date(),
          expiryDate: subscription.endDate,
        },
      });
      await tx.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: 'EMPLOYEE_LICENSE_CREATED',
          entity: 'License',
          entityId: created.id,
        },
      });
      return created;
    });
    return license;
  }

  async setEmployeeStatus(
    companyId: string,
    adminUserId: string,
    employeeId: string,
    isActive: boolean,
  ) {
    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, companyId, role: Role.EMPLOYEE },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: employeeId },
        data: { isActive, tokenVersion: { increment: 1 } },
      });
      if (!isActive) {
        const licenses = await tx.license.findMany({
          where: { userId: employeeId, companyId },
          select: { id: true },
        });
        const licenseIds = licenses.map((license) => license.id);
        await tx.device.deleteMany({ where: { licenseId: { in: licenseIds } } });
        await tx.license.updateMany({
          where: { id: { in: licenseIds }, status: { not: LicenseStatus.REVOKED } },
          data: { status: LicenseStatus.SUSPENDED, currentDevices: 0 },
        });
      }
      await tx.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: isActive ? 'EMPLOYEE_ENABLED' : 'EMPLOYEE_DISABLED',
          entity: 'User',
          entityId: employeeId,
        },
      });
    });
    return { success: true };
  }

  async resetEmployeePassword(
    companyId: string,
    adminUserId: string,
    employeeId: string,
    newPassword: string,
  ) {
    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, companyId, role: Role.EMPLOYEE },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: employeeId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: 'EMPLOYEE_PASSWORD_RESET',
          entity: 'User',
          entityId: employeeId,
        },
      }),
    ]);

    // Send password reset notification email
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    void this.mail.sendPasswordResetEmail({
      to: employee.email,
      fullName: employee.fullName,
      username: employee.username,
      newPassword,
      companyName: company?.name ?? 'Your Company',
    });

    return { success: true };
  }

  async deleteEmployee(companyId: string, adminUserId: string, employeeId: string) {
    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, companyId, role: Role.EMPLOYEE },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    await this.prisma.$transaction(async (tx) => {
      // Find licenses assigned to this employee
      const licenses = await tx.license.findMany({
        where: { userId: employeeId, companyId },
        select: { id: true },
      });
      const licenseIds = licenses.map((l) => l.id);

      // Clean up devices attached to employee's licenses or user
      if (licenseIds.length > 0) {
        await tx.device.deleteMany({ where: { licenseId: { in: licenseIds } } });
      }
      await tx.device.deleteMany({ where: { userId: employeeId } });

      // Delete assigned licenses to free up slots
      await tx.license.deleteMany({ where: { userId: employeeId } });

      // Delete login logs
      await tx.loginLog.deleteMany({ where: { userId: employeeId } });

      // Delete user
      await tx.user.delete({ where: { id: employeeId } });

      // Audit log
      await tx.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: 'EMPLOYEE_DELETED',
          entity: 'User',
          entityId: employeeId,
        },
      });
    });

    return { success: true, message: 'Employee permanently deleted' };
  }

  async resetDevices(
    companyId: string,
    adminUserId: string,
    licenseId: string,
  ) {
    return this.resetEmployeeDevices(companyId, adminUserId, licenseId);
  }

  async revokeLicense(
    companyId: string,
    adminUserId: string,
    licenseId: string,
  ) {
    return this.revokeEmployeeLicense(companyId, adminUserId, licenseId);
  }

  async reactivateEmployeeLicense(
    companyId: string,
    adminUserId: string,
    licenseId: string,
  ) {
    const subscription = await this.entitlements.assertCompanyActive(companyId);
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, companyId, subscriptionId: subscription.id },
      include: { user: true },
    });
    if (!license) throw new NotFoundException('Employee license key not found');

    await this.prisma.$transaction([
      this.prisma.license.update({
        where: { id: license.id },
        data: { status: LicenseStatus.ACTIVE },
      }),
      this.prisma.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: 'EMPLOYEE_LICENSE_REACTIVATED',
          entity: 'License',
          entityId: license.id,
        },
      }),
    ]);

    // Notify employee their license is active again
    if (license.user) {
      const company = await this.prisma.company.findUnique({ where: { id: companyId } });
      void this.mail.sendLicenseReactivatedEmail({
        to: license.user.email,
        fullName: license.user.fullName,
        username: license.user.username,
        licenseKey: license.key,
        companyName: company?.name ?? 'Your Company',
      });
    }

    return { success: true };
  }

  async resetEmployeeDevices(
    companyId: string,
    adminUserId: string,
    licenseId: string,
  ) {
    const subscription = await this.entitlements.assertCompanyActive(companyId);
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, companyId, subscriptionId: subscription.id },
    });
    if (!license) throw new NotFoundException('Employee license key not found');

    await this.prisma.$transaction([
      this.prisma.device.deleteMany({ where: { licenseId: license.id } }),
      this.prisma.license.update({
        where: { id: license.id },
        data: { currentDevices: 0 },
      }),
      this.prisma.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: 'EMPLOYEE_DEVICE_RESET',
          entity: 'License',
          entityId: license.id,
        },
      }),
    ]);
    return { success: true };
  }

  async revokeEmployeeLicense(
    companyId: string,
    adminUserId: string,
    licenseId: string,
  ) {
    const subscription = await this.entitlements.assertCompanyActive(companyId);
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, companyId, subscriptionId: subscription.id },
    });
    if (!license) throw new NotFoundException('Employee license key not found');

    await this.prisma.$transaction([
      this.prisma.device.deleteMany({ where: { licenseId: license.id } }),
      this.prisma.license.update({
        where: { id: license.id },
        data: { status: LicenseStatus.REVOKED, currentDevices: 0 },
      }),
      this.prisma.auditLog.create({
        data: {
          companyId,
          userId: adminUserId,
          action: 'EMPLOYEE_LICENSE_REVOKED',
          entity: 'License',
          entityId: license.id,
        },
      }),
    ]);
    return { success: true };
  }

  async getDriveConnection(companyId: string) {
    const conn = await this.prisma.googleDriveConnection.findUnique({
      where: { companyId },
    });
    if (!conn) {
      return { connected: false, accountEmail: null, rootFolderName: null, lastVerifiedAt: null };
    }
    return {
      connected: true,
      accountEmail: conn.accountEmail,
      rootFolderName: conn.rootFolderName,
      lastVerifiedAt: conn.lastVerifiedAt.toISOString(),
      connectedAt: conn.connectedAt.toISOString(),
    };
  }

  async configureDriveConnection(
    companyId: string,
    adminUserId: string,
    input: { clientId?: string; clientSecret?: string; refreshToken: string; rootFolderName?: string },
  ) {
    const clientId =
      input.clientId?.trim() ||
      process.env.GOOGLE_DRIVE_CLIENT_ID ||
      '407408718192.apps.googleusercontent.com';
    const clientSecret =
      input.clientSecret?.trim() ||
      process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
      '';
    const refreshToken = input.refreshToken.trim();

    if (!refreshToken) {
      throw new ForbiddenException('Google Drive Refresh Token is required.');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let accountEmail: string | null = null;
    let rootFolderId: string;
    const rootFolderName = input.rootFolderName?.trim() || 'ScreenAdvait Screenshots';

    try {
      const about = await drive.about.get({ fields: 'user(emailAddress)' });
      accountEmail = about.data.user?.emailAddress || null;

      const escapedName = rootFolderName.replace(/['\\]/g, '\\$&');
      const existingFolder = await drive.files.list({
        q: `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
        pageSize: 1,
      });

      if (existingFolder.data.files?.[0]?.id) {
        rootFolderId = existingFolder.data.files[0].id;
      } else {
        const createdFolder = await drive.files.create({
          requestBody: {
            name: rootFolderName,
            mimeType: 'application/vnd.google-apps.folder',
          },
          fields: 'id',
        });
        if (!createdFolder.data.id) throw new Error('Could not create Google Drive root folder');
        rootFolderId = createdFolder.data.id;
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error_description ||
        err?.response?.data?.error ||
        err?.message ||
        'Invalid Refresh Token or Client credentials';
      throw new ForbiddenException(
        `Google Drive verification failed: ${errorMsg}. Make sure Client ID, Client Secret, and Refresh Token belong to the same Google OAuth app.`,
      );
    }

    const encryptedToken = encryptText(JSON.stringify({ refreshToken, clientId, clientSecret }));

    const connection = await this.prisma.googleDriveConnection.upsert({
      where: { companyId },
      create: {
        companyId,
        connectedByUserId: adminUserId,
        refreshTokenEncrypted: encryptedToken,
        rootFolderId,
        rootFolderName,
        accountEmail,
        connectedAt: new Date(),
        lastVerifiedAt: new Date(),
      },
      update: {
        connectedByUserId: adminUserId,
        refreshTokenEncrypted: encryptedToken,
        rootFolderId,
        rootFolderName,
        accountEmail,
        lastVerifiedAt: new Date(),
      },
    });

    return {
      connected: true,
      accountEmail: connection.accountEmail,
      rootFolderName: connection.rootFolderName,
      lastVerifiedAt: connection.lastVerifiedAt.toISOString(),
    };
  }

  async testDriveConnection(companyId: string) {
    const conn = await this.prisma.googleDriveConnection.findUnique({
      where: { companyId },
    });
    if (!conn) throw new NotFoundException('No Google Drive connection configured for this company');

    try {
      const { refreshToken, clientId, clientSecret } = JSON.parse(decryptText(conn.refreshTokenEncrypted));
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const about = await drive.about.get({ fields: 'user(emailAddress)' });
      await this.prisma.googleDriveConnection.update({
        where: { id: conn.id },
        data: { lastVerifiedAt: new Date(), accountEmail: about.data.user?.emailAddress || conn.accountEmail },
      });
      return { success: true, accountEmail: about.data.user?.emailAddress || conn.accountEmail };
    } catch (error: any) {
      throw new ForbiddenException(`Drive health check failed: ${error?.message || 'Token expired'}`);
    }
  }

  async disconnectDriveConnection(companyId: string) {
    await this.prisma.googleDriveConnection.deleteMany({
      where: { companyId },
    });
    return { connected: false };
  }
}
