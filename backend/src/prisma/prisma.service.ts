import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Role, LicensePlan, LicenseStatus, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureInitialSeed();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureInitialSeed() {
    try {
      const superAdminCount = await this.user.count({
        where: { role: Role.SUPER_ADMIN },
      });

      const autoSeed = process.env.AUTO_SEED === 'true';

      if (superAdminCount > 0 && !autoSeed) {
        return;
      }

      this.logger.log('🌱 Ensuring initial SuperAdmin credentials & demo data...');

      const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@system.com';
      const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026!';
      const superadminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
      const seedLicenseKey = process.env.SEED_DEMO_LICENSE_KEY || 'SA-DEMO-2026-KEY-9999';

      // 1. Create Default Company
      const company = await this.company.upsert({
        where: { code: 'DEMO' },
        update: {},
        create: {
          name: 'Demo Enterprise Inc.',
          code: 'DEMO',
          contactEmail: 'admin@demoenterprise.com',
          contactPhone: '+1-555-0192',
          maxUsers: 50,
          maxStorageMb: BigInt(51200), // 50 GB
        },
      });

      const passwordHash = await bcrypt.hash(superadminPassword, 12);

      // 2. Create Super Admin User
      const superAdmin = await this.user.upsert({
        where: { email: superadminEmail },
        update: { passwordHash, username: superadminUsername, isActive: true },
        create: {
          companyId: company.id,
          email: superadminEmail,
          username: superadminUsername,
          fullName: 'Super Administrator',
          passwordHash,
          role: Role.SUPER_ADMIN,
        },
      });

      // 3. Create Company Admin User
      const companyAdmin = await this.user.upsert({
        where: { email: 'admin@demoenterprise.com' },
        update: { passwordHash },
        create: {
          companyId: company.id,
          email: 'admin@demoenterprise.com',
          username: 'compadmin',
          fullName: 'John Enterprise Admin',
          passwordHash,
          role: Role.COMPANY_ADMIN,
        },
      });

      // 4. Create Employee User
      const employee = await this.user.upsert({
        where: { email: 'employee1@demoenterprise.com' },
        update: { passwordHash },
        create: {
          companyId: company.id,
          email: 'employee1@demoenterprise.com',
          username: 'employee1',
          fullName: 'Alice Employee',
          passwordHash,
          role: Role.EMPLOYEE,
        },
      });

      // 5. Create Subscription & License
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(issueDate.getFullYear() + 1);

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
        update: { userId: employee.id, subscriptionId: subscription.id },
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

      this.logger.log(`✅ SuperAdmin initialized successfully! Email: ${superadminEmail}`);
    } catch (error) {
      this.logger.error('Failed to auto-seed initial superadmin credentials:', error);
    }
  }
}
