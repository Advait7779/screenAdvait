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
      this.logger.log('🌱 Checking / Initializing SuperAdmin credentials...');

      const superadminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@system.com').trim().toLowerCase();
      const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026!';
      const superadminUsername = (process.env.SUPERADMIN_USERNAME || 'superadmin').trim();
      const seedLicenseKey = process.env.SEED_DEMO_LICENSE_KEY || 'SA-DEMO-2026-KEY-9999';

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

      const passwordHash = await bcrypt.hash(superadminPassword, 12);

      // 2. Upsert Super Admin User (by email)
      const superAdmin = await this.user.upsert({
        where: { email: superadminEmail },
        update: {
          passwordHash,
          username: superadminUsername,
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
        create: {
          companyId: company.id,
          email: superadminEmail,
          username: superadminUsername,
          fullName: 'Super Administrator',
          passwordHash,
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
      });

      // 3. Ensure Company Admin User
      const companyAdmin = await this.user.upsert({
        where: { email: 'admin@demoenterprise.com' },
        update: { passwordHash, isActive: true },
        create: {
          companyId: company.id,
          email: 'admin@demoenterprise.com',
          username: 'compadmin',
          fullName: 'John Enterprise Admin',
          passwordHash,
          role: Role.COMPANY_ADMIN,
          isActive: true,
        },
      });

      // 4. Ensure Employee User
      const employee = await this.user.upsert({
        where: { email: 'employee1@demoenterprise.com' },
        update: { passwordHash, isActive: true },
        create: {
          companyId: company.id,
          email: 'employee1@demoenterprise.com',
          username: 'employee1',
          fullName: 'Alice Employee',
          passwordHash,
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
