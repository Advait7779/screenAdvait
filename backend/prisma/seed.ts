import {
  PrismaClient,
  Role,
  LicensePlan,
  LicenseStatus,
  SubscriptionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const autoSeed = process.env.AUTO_SEED === 'true';

  if (isProduction && !autoSeed) {
    console.log('ℹ️ Seeding skipped (AUTO_SEED is not true in production)');
    return;
  }

  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@system.com';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026!';
  const superadminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const seedLicenseKey = process.env.SEED_DEMO_LICENSE_KEY || 'SA-DEMO-2026-KEY-9999';

  console.log('🌱 Starting Database Seeding...');

  // 1. Create Default Company
  const company = await prisma.company.upsert({
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
  const superAdmin = await prisma.user.upsert({
    where: { email: superadminEmail },
    update: { passwordHash },
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
  const companyAdmin = await prisma.user.upsert({
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
  const employee = await prisma.user.upsert({
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

  // 5. Create the company subscription, then a child employee license.
  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(issueDate.getFullYear() + 1);

  const subscription =
    (await prisma.subscription.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })) ||
    (await prisma.subscription.create({
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

  const license = await prisma.license.upsert({
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

  console.log('✅ Database Seeding Complete!');
  console.log('----------------------------------------------------');
  console.log(`Company: ${company.name} (${company.code})`);
  console.log(`License Key: ${license.key} (Plan: ${license.plan})`);
  console.log('User Credentials:');
  console.log('Demo users created. Password values are intentionally not printed.');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
