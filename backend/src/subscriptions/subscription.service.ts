import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  LicensePlan,
  LicenseStatus,
  Role,
  SubscriptionStatus,
} from '@prisma/client';
import {
  SubscriptionStatusInput,
  UpsertCompanySubscriptionInput,
} from '@screenadvait/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: UpsertCompanySubscriptionInput, adminUserId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: input.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const [employeeCount, allocation] = await Promise.all([
      this.prisma.user.count({
        where: { companyId: input.companyId, role: Role.EMPLOYEE },
      }),
      this.prisma.license.aggregate({
        where: { companyId: input.companyId, status: { not: LicenseStatus.REVOKED } },
        _sum: { maxDevices: true },
      }),
    ]);
    if (input.maxEmployees < employeeCount) {
      throw new BadRequestException(
        `Employee limit cannot be below current usage (${employeeCount})`,
      );
    }
    if (input.maxDevices < (allocation._sum.maxDevices || 0)) {
      throw new BadRequestException(
        `Device limit cannot be below allocated slots (${allocation._sum.maxDevices || 0})`,
      );
    }
    const current = await this.prisma.subscription.findFirst({
      where: { companyId: input.companyId },
      orderBy: [{ createdAt: 'desc' }, { startDate: 'desc' }],
    });
    const effectiveStorageMb = Number(
      current?.maxStorageMb ?? company.maxStorageMb ?? BigInt(51200),
    );
    const startDate = new Date();
    // Editing quotas or plan labels must not silently grant a fresh term.
    // Renewal is a separate, audited action.
    const endDate = current?.endDate
      ?? this.expiryForPlan(startDate, input.plan, input.customExpiryDays);

    const subscription = await this.prisma.$transaction(async (tx) => {
      const saved = current
        ? await tx.subscription.update({
            where: { id: current.id },
            data: {
              plan: input.plan,
              status:
                current.status === SubscriptionStatus.ACTIVE &&
                current.endDate.getTime() <= Date.now()
                  ? SubscriptionStatus.EXPIRED
                  : current.status,
              endDate,
              maxEmployees: input.maxEmployees,
              maxDevices: input.maxDevices,
              maxStorageMb: BigInt(effectiveStorageMb),
              createdByUserId: adminUserId,
            },
          })
        : await tx.subscription.create({
            data: {
              companyId: input.companyId,
              plan: input.plan,
              status: SubscriptionStatus.ACTIVE,
              startDate,
              endDate,
              maxEmployees: input.maxEmployees,
              maxDevices: input.maxDevices,
              maxStorageMb: BigInt(effectiveStorageMb),
              createdByUserId: adminUserId,
            },
          });

      await tx.company.update({
        where: { id: input.companyId },
        data: {
          maxUsers: input.maxEmployees,
          maxStorageMb: BigInt(effectiveStorageMb),
        },
      });
      if (current) {
        await tx.license.updateMany({
          where: {
            subscriptionId: current.id,
            status: LicenseStatus.ACTIVE,
            expiryDate: { lte: current.endDate },
          },
          data: { expiryDate: endDate, plan: input.plan },
        });
      } else {
        await tx.license.updateMany({
          where: { companyId: input.companyId },
          data: { subscriptionId: saved.id },
        });
      }
      await tx.auditLog.create({
        data: {
          companyId: input.companyId,
          userId: adminUserId,
          action: current ? 'SUBSCRIPTION_UPDATED' : 'SUBSCRIPTION_CREATED',
          entity: 'Subscription',
          entityId: saved.id,
          details: {
            plan: input.plan,
            endDate: endDate.toISOString(),
            maxEmployees: input.maxEmployees,
            maxDevices: input.maxDevices,
            maxStorageMb: effectiveStorageMb,
          },
        },
      });
      return saved;
    });
    return this.toResponse(subscription);
  }

  async renew(id: string, days: number, adminUserId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException('Subscription not found');
    const oldEndDate = subscription.endDate;
    const newEndDate = new Date(
      Math.max(Date.now(), oldEndDate.getTime()) + days * 24 * 60 * 60_000,
    );

    const renewed = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.subscription.update({
        where: { id },
        data: { endDate: newEndDate, status: SubscriptionStatus.ACTIVE },
      });
      await tx.license.updateMany({
        where: {
          subscriptionId: id,
          status: LicenseStatus.ACTIVE,
          expiryDate: { lte: oldEndDate },
        },
        data: { expiryDate: newEndDate },
      });
      await tx.auditLog.create({
        data: {
          companyId: subscription.companyId,
          userId: adminUserId,
          action: 'SUBSCRIPTION_RENEWED',
          entity: 'Subscription',
          entityId: id,
          details: { days, newEndDate: newEndDate.toISOString() },
        },
      });
      return saved;
    });
    return this.toResponse(renewed);
  }

  async setStatus(id: string, input: SubscriptionStatusInput, adminUserId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException('Subscription not found');
    const status = input.status as SubscriptionStatus;
    const saved = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({ where: { id }, data: { status } });
      await tx.auditLog.create({
        data: {
          companyId: subscription.companyId,
          userId: adminUserId,
          action: `SUBSCRIPTION_${status}`,
          entity: 'Subscription',
          entityId: id,
        },
      });
      return updated;
    });
    return this.toResponse(saved);
  }

  async getAll() {
    const subscriptions = await this.prisma.subscription.findMany({
      include: {
        company: true,
        licenses: { select: { id: true, maxDevices: true, currentDevices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      subscriptions.map(async (subscription) => {
        const [employeeCount, storage] = await Promise.all([
          this.prisma.user.count({
            where: { companyId: subscription.companyId, role: Role.EMPLOYEE },
          }),
          this.prisma.screenshot.aggregate({
            where: { companyId: subscription.companyId },
            _sum: { fileSize: true },
          }),
        ]);
        return {
          ...this.toResponse(subscription),
          company: {
            id: subscription.company.id,
            name: subscription.company.name,
            code: subscription.company.code,
          },
          usage: {
            employees: employeeCount,
            devices: subscription.licenses.reduce(
              (total, license) => total + license.currentDevices,
              0,
            ),
            allocatedDeviceSlots: subscription.licenses.reduce(
              (total, license) => total + license.maxDevices,
              0,
            ),
            storageMb: Number(storage._sum.fileSize || BigInt(0)) / 1024 / 1024,
          },
        };
      }),
    );
  }

  private expiryForPlan(start: Date, plan: LicensePlan, customDays?: number) {
    const planDays: Record<LicensePlan, number> = {
      TRIAL: 14,
      MONTHLY: 30,
      QUARTERLY: 90,
      SIX_MONTHS: 180,
      ONE_YEAR: 365,
      LIFETIME: 36500,
    };
    return new Date(start.getTime() + (customDays || planDays[plan]) * 24 * 60 * 60_000);
  }

  private toResponse(subscription: any) {
    return {
      ...subscription,
      maxStorageMb: Number(subscription.maxStorageMb),
    };
  }
}
