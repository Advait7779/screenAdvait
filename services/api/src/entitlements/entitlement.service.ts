import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  LicenseStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentSubscription(companyId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { companyId },
      orderBy: [{ createdAt: 'desc' }, { startDate: 'desc' }],
    });
    if (!subscription) return null;

    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.endDate.getTime() <= Date.now()
    ) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    }
    return subscription;
  }

  async assertCompanyActive(companyId: string) {
    const subscription = await this.getCurrentSubscription(companyId);
    if (!subscription) {
      throw new ForbiddenException('Company subscription is not configured');
    }
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new ForbiddenException(`Company subscription is ${subscription.status}`);
    }
    if (subscription.endDate.getTime() <= Date.now()) {
      throw new ForbiddenException('Company subscription is EXPIRED');
    }
    return subscription;
  }

  async getLicenseEntitlement(licenseId: string) {
    const license = await this.prisma.license.findUnique({
      where: { id: licenseId },
      include: { subscription: true },
    });
    if (!license) throw new NotFoundException('License not found');

    let subscription = license.subscription;
    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.endDate.getTime() <= Date.now()
    ) {
      subscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    }

    const now = Date.now();
    let effectiveStatus: string = LicenseStatus.ACTIVE;
    let message = 'License and company subscription are active';
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      effectiveStatus = subscription.status;
      message = `Company subscription is ${subscription.status}`;
    } else if (subscription.endDate.getTime() <= now) {
      effectiveStatus = SubscriptionStatus.EXPIRED;
      message = 'Company subscription is EXPIRED';
    } else if (license.status !== LicenseStatus.ACTIVE) {
      effectiveStatus = license.status;
      message = `Employee license is ${license.status}`;
    } else if (license.expiryDate.getTime() <= now) {
      effectiveStatus = LicenseStatus.EXPIRED;
      message = 'Employee license is EXPIRED';
    }

    return {
      active: effectiveStatus === LicenseStatus.ACTIVE,
      effectiveStatus,
      message,
      license,
      subscription,
      effectiveExpiryDate:
        license.expiryDate < subscription.endDate
          ? license.expiryDate
          : subscription.endDate,
    };
  }

  async assertLicenseActive(licenseId: string) {
    const entitlement = await this.getLicenseEntitlement(licenseId);
    if (!entitlement.active) {
      throw new ForbiddenException(entitlement.message);
    }
    return entitlement;
  }
}
