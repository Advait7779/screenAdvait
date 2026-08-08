import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Role, LicensePlan, LicenseStatus, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    if (process.env.AUTO_SEED === 'true') {
      await this.ensureInitialSeed();
    } else {
      this.logger.log('Automatic demo seed is disabled');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureInitialSeed() {
    try {
      this.logger.log('🌱 Checking / Initializing SuperAdmin credentials...');

      const superadminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@system.com').trim().toLowerCase();
      const superadminPassword = process.env.SUPERADMIN_PASSWORD?.trim();
      const demoPassword = process.env.SEED_DEMO_PASSWORD?.trim();
      const superadminUsername = (process.env.SUPERADMIN_USERNAME || 'superadmin').trim();
      const seedLicenseKey = process.env.SEED_DEMO_LICENSE_KEY || 'SA-DEMO-2026-KEY-9999';

      if (!superadminPassword || superadminPassword.length < 12) {
        throw new Error('AUTO_SEED requires SUPERADMIN_PASSWORD with at least 12 characters');
      }
      if (!demoPassword || demoPassword.length < 12) {
        throw new Error('AUTO_SEED requires SEED_DEMO_PASSWORD with at least 12 characters');
      }

      // 1. Create / Ensure Default Company
      const company = await this.company.upsert({
        where: { code: 'DEMO' },
        update: {},
        create: {
          name: 'Demo Enterprise Inc.',
          code: 'DEMO',
          contactEmail: 'admin@demoenterprise.com',
          contactPhone: '+1-555-0192',
          maxUsers: 50,
          maxStorageMb: BigInt(51200),
        },
      });

      const superadminPasswordHash = await bcrypt.hash(superadminPassword, 12);
      const demoPasswordHash = await bcrypt.hash(demoPassword, 12);

      // 2. Ensure Super Admin User — handle username/email conflicts gracefully
      //    First, claim the username by updating any existing user that has it
      const existingByUsername = await this.user.findUnique({ where: { username: superadminUsername } });
      const existingByEmail = await this.user.findUnique({ where: { email: superadminEmail } });

      let superAdmin;
      if (existingByUsername && existingByEmail && existingByUsername.id === existingByEmail.id) {
        // Same user has both — just update
        superAdmin = await this.user.update({
          where: { id: existingByUsername.id },
          data: { role: Role.SUPER_ADMIN, isActive: true },
        });
      } else if (existingByUsername) {
        // Username exists with a different email — update that user's email + password
        superAdmin = await this.user.update({
          where: { id: existingByUsername.id },
          data: { email: superadminEmail, role: Role.SUPER_ADMIN, isActive: true },
        });
        // If a different user had the target email, clear it to avoid conflict
        if (existingByEmail && existingByEmail.id !== existingByUsername.id) {
          await this.user.update({
            where: { id: existingByEmail.id },
            data: { email: `stale-${Date.now()}@cleanup.local` },
          });
        }
      } else if (existingByEmail) {
        // Email exists but different username — update username
        superAdmin = await this.user.update({
          where: { id: existingByEmail.id },
          data: { username: superadminUsername, role: Role.SUPER_ADMIN, isActive: true },
        });
      } else {
        // Neither exists — create fresh
        superAdmin = await this.user.create({
          data: {
            companyId: company.id,
            email: superadminEmail,
            username: superadminUsername,
            fullName: 'Super Administrator',
            passwordHash: superadminPasswordHash,
            role: Role.SUPER_ADMIN,
            isActive: true,
          },
        });
      }

      // 3. Ensure Company Admin User
      const companyAdmin = await this.user.upsert({
        where: { email: 'admin@demoenterprise.com' },
        update: { isActive: true },
        create: {
          companyId: company.id,
          email: 'admin@demoenterprise.com',
          username: 'compadmin',
          fullName: 'John Enterprise Admin',
          passwordHash: demoPasswordHash,
          role: Role.COMPANY_ADMIN,
          isActive: true,
        },
      });

      // 4. Ensure Employee User
      const employee = await this.user.upsert({
        where: { email: 'employee1@demoenterprise.com' },
        update: { isActive: true },
        create: {
          companyId: company.id,
          email: 'employee1@demoenterprise.com',
          username: 'employee1',
          fullName: 'Alice Employee',
          passwordHash: demoPasswordHash,
          role: Role.EMPLOYEE,
          isActive: true,
        },
      });

      // 5. Ensure Subscription & License
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(issueDate.getFullYear() + 10); // 10 years active

      const subscription =
        (await this.subscription.findFirst({
          where: { companyId: company.id },
          orderBy: { createdAt: 'desc' },
        })) ||
        (await this.subscription.create({
          data: {
            companyId: company.id,
            plan: LicensePlan.ONE_YEAR,
            status: SubscriptionStatus.ACTIVE,
            startDate: issueDate,
            endDate: expiryDate,
            maxEmployees: 50,
            maxDevices: 50,
            maxStorageMb: BigInt(51200),
            createdByUserId: superAdmin.id,
          },
        }));

      await this.license.upsert({
        where: { key: seedLicenseKey },
        update: { userId: employee.id, subscriptionId: subscription.id, status: LicenseStatus.ACTIVE },
        create: {
          key: seedLicenseKey,
          companyId: company.id,
          subscriptionId: subscription.id,
          userId: employee.id,
          plan: LicensePlan.ONE_YEAR,
          status: LicenseStatus.ACTIVE,
          maxDevices: 5,
          currentDevices: 0,
          issueDate,
          expiryDate,
        },
      });

      this.logger.log('======================================================');
      this.logger.log('✅ SuperAdmin Initialized & Verified Successfully!');
      this.logger.log(`   Username: ${superadminUsername}`);
      this.logger.log(`   Email:    ${superadminEmail}`);
      this.logger.log('======================================================');
    } catch (error) {
      this.logger.error('CRITICAL: Failed to auto-seed initial superadmin credentials:', error);
    }
  }
}
