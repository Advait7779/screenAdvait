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

@Injectable()
export class CompanyAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementService,
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
    return { success: true };
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
}
