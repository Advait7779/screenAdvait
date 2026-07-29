import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateLicenseKey, GenerateLicenseInput } from '@screenadvait/shared-utils';
import { LicensePlan, LicenseStatus } from '@prisma/client';
import { EntitlementService } from '../entitlements/entitlement.service.js';

@Injectable()
export class LicenseService {
  constructor(
    private prisma: PrismaService,
    private readonly entitlements: EntitlementService,
  ) {}

  async verifyLicense(key: string, deviceId: string, machineGuid: string) {
    const license = await this.prisma.license.findUnique({
      where: { key: key.toUpperCase() },
      include: { company: true },
    });

    if (!license) {
      return { valid: false, message: 'License key not found' };
    }

    const now = new Date();
    const entitlement = await this.entitlements.getLicenseEntitlement(license.id);
    if (!entitlement.active) {
      return {
        valid: false,
        status: entitlement.effectiveStatus,
        expiryDate: entitlement.effectiveExpiryDate.toISOString(),
        subscriptionStatus: entitlement.subscription.status,
        message: entitlement.message,
      };
    }

    let device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device && entitlement.active) {
      const count = await this.prisma.device.count({ where: { licenseId: license.id } });
      if (count < license.maxDevices && license.userId) {
        device = await this.prisma.device.create({
          data: {
            userId: license.userId,
            licenseId: license.id,
            deviceId,
            machineGuid,
            os: 'Windows',
            computerName: 'WORKSTATION',
          },
        });
      }
    }

    if (
      !device ||
      device.machineGuid !== machineGuid ||
      device.licenseId !== license.id
    ) {
      return { valid: false, message: 'Device hardware GUID mismatch or unactivated device' };
    }

    const diffMs = license.expiryDate.getTime() - now.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const currentDevices = await this.prisma.device.count({ where: { licenseId: license.id } });
    await this.prisma.license.update({
      where: { id: license.id },
      data: { lastVerification: new Date(), currentDevices },
    });

    return {
      valid: true,
      status: license.status,
      expiryDate: license.expiryDate.toISOString(),
      remainingDays: Math.max(0, remainingDays),
      maxDevices: license.maxDevices,
      currentDevices,
      effectiveStatus: entitlement.effectiveStatus,
      subscriptionStatus: entitlement.subscription.status,
      subscriptionEndDate: entitlement.subscription.endDate.toISOString(),
      effectiveExpiryDate: entitlement.effectiveExpiryDate.toISOString(),
    };
  }

  async generateLicense(input: GenerateLicenseInput, adminUserId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: input.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!input.userId) {
      throw new BadRequestException(
        'Employee assignment is required. Company admins create employee keys.',
      );
    }
    const user = await this.prisma.user.findFirst({
      where: { id: input.userId, companyId: input.companyId, isActive: true },
    });
    if (!user) throw new NotFoundException('Active user not found in target company');
    const subscription = await this.entitlements.assertCompanyActive(input.companyId);

    let key = generateLicenseKey('ATS');
    while (await this.prisma.license.findUnique({ where: { key }, select: { id: true } })) {
      key = generateLicenseKey('ATS');
    }

    let days = 30;
    if (input.customExpiryDays) {
      days = input.customExpiryDays;
    } else {
      switch (input.plan) {
        case LicensePlan.TRIAL:
          days = 14;
          break;
        case LicensePlan.MONTHLY:
          days = 30;
          break;
        case LicensePlan.QUARTERLY:
          days = 90;
          break;
        case LicensePlan.SIX_MONTHS:
          days = 180;
          break;
        case LicensePlan.ONE_YEAR:
          days = 365;
          break;
        case LicensePlan.LIFETIME:
          days = 36500; // 100 years
          break;
      }
    }

    const issueDate = new Date();
    const requestedExpiryDate = new Date();
    requestedExpiryDate.setDate(issueDate.getDate() + days);
    const expiryDate =
      requestedExpiryDate < subscription.endDate
        ? requestedExpiryDate
        : subscription.endDate;

    const license = await this.prisma.$transaction(async (tx) => {
      const created = await tx.license.create({
        data: {
          key,
          companyId: input.companyId,
          subscriptionId: subscription.id,
          userId: input.userId,
          plan: input.plan,
          status: LicenseStatus.ACTIVE,
          maxDevices: input.maxDevices,
          issueDate,
          expiryDate,
        },
      });
      await tx.licenseHistory.create({
        data: {
          licenseId: created.id,
          action: 'CREATED',
          performedBy: adminUserId,
          notes: `Plan: ${input.plan}, Days: ${days}, Max Devices: ${created.maxDevices}`,
        },
      });
      return created;
    });

    return license;
  }

  async renewLicense(licenseId: string, days: number, adminUserId: string) {
    const license = await this.prisma.license.findUnique({
      where: { id: licenseId },
      include: { subscription: true },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    const currentExpiry = new Date(license.expiryDate);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    const cappedExpiry =
      baseDate < license.subscription.endDate
        ? baseDate
        : license.subscription.endDate;

    const updated = await this.prisma.$transaction(async (tx) => {
      const renewed = await tx.license.update({
        where: { id: licenseId },
        data: {
          expiryDate: cappedExpiry,
          renewalDate: new Date(),
          status: LicenseStatus.ACTIVE,
        },
      });
      await tx.licenseHistory.create({
        data: {
          licenseId,
          action: 'RENEWED',
          performedBy: adminUserId,
          notes: `Extended by ${days} days. New expiry: ${cappedExpiry.toISOString()}`,
        },
      });
      return renewed;
    });

    return updated;
  }

  async getCurrentStatus(licenseId: string) {
    const entitlement = await this.entitlements.getLicenseEntitlement(licenseId);
    return {
      active: entitlement.active,
      effectiveStatus: entitlement.effectiveStatus,
      message: entitlement.message,
      licenseStatus: entitlement.license.status,
      licenseExpiryDate: entitlement.license.expiryDate.toISOString(),
      subscriptionStatus: entitlement.subscription.status,
      subscriptionEndDate: entitlement.subscription.endDate.toISOString(),
      effectiveExpiryDate: entitlement.effectiveExpiryDate.toISOString(),
    };
  }

  async resetDevices(licenseId: string, adminUserId: string) {
    const license = await this.prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    // Delete all device registrations under this license
    await this.prisma.$transaction([
      this.prisma.device.deleteMany({
        where: { licenseId },
      }),
      this.prisma.license.update({
        where: { id: licenseId },
        data: { currentDevices: 0 },
      }),
    ]);

    await this.prisma.licenseHistory.create({
      data: {
        licenseId,
        action: 'DEVICE_RESET',
        performedBy: adminUserId,
        notes: 'Reset all active device activations',
      },
    });

    return { message: 'License device bindings reset successfully' };
  }

  async reactivateLicense(licenseId: string, adminUserId: string) {
    const license = await this.prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.license.update({
        where: { id: licenseId },
        data: { status: LicenseStatus.ACTIVE },
      });
      await tx.licenseHistory.create({
        data: {
          licenseId,
          action: 'REACTIVATED',
          performedBy: adminUserId,
          notes: 'License status reactivated to ACTIVE',
        },
      });
      return saved;
    });

    return updated;
  }

  async getAllLicenses() {
    const licenses = await this.prisma.license.findMany({
      select: {
        id: true,
        key: true,
        companyId: true,
        subscriptionId: true,
        userId: true,
        plan: true,
        status: true,
        maxDevices: true,
        currentDevices: true,
        issueDate: true,
        expiryDate: true,
        renewalDate: true,
        lastVerification: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: { id: true, name: true, code: true, contactEmail: true },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            endDate: true,
            maxEmployees: true,
            maxDevices: true,
          },
        },
        user: {
          select: { id: true, username: true, fullName: true, email: true, isActive: true },
        },
        devices: {
          select: { id: true, deviceId: true, os: true, computerName: true, activatedAt: true, lastSeenAt: true },
        },
        history: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return licenses;
  }
}
