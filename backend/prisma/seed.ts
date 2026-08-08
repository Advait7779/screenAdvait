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
  if (process.env.AUTO_SEED !== 'true') {
    console.log('Seeding skipped because AUTO_SEED is not true');
    return;
  }

  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@system.com';
  const superadminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD?.trim();
  const demoPassword = process.env.SEED_DEMO_PASSWORD?.trim();
  const seedLicenseKey = process.env.SEED_DEMO_LICENSE_KEY || 'SA-DEMO-2026-KEY-9999';

  if (!superadminPassword || superadminPassword.length < 12) {
    throw new Error('AUTO_SEED requires SUPERADMIN_PASSWORD with at least 12 characters');
  }
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error('AUTO_SEED requires SEED_DEMO_PASSWORD with at least 12 characters');
  }

  console.log('Starting explicit demo database seed...');

  const company = await prisma.company.upsert({
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

  const superAdmin = await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {},
    create: {
      companyId: company.id,
      email: superadminEmail,
      username: superadminUsername,
      fullName: 'Super Administrator',
      passwordHash: superadminPasswordHash,
      role: Role.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@demoenterprise.com' },
    update: {},
    create: {
      companyId: company.id,
      email: 'admin@demoenterprise.com',
      username: 'compadmin',
      fullName: 'John Enterprise Admin',
      passwordHash: demoPasswordHash,
      role: Role.COMPANY_ADMIN,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee1@demoenterprise.com' },
    update: {},
    create: {
      companyId: company.id,
      email: 'employee1@demoenterprise.com',
      username: 'employee1',
      fullName: 'Alice Employee',
      passwordHash: demoPasswordHash,
      role: Role.EMPLOYEE,
    },
  });

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

  console.log('Database seed complete');
  console.log(`Company: ${company.name} (${company.code})`);
  console.log(`License Key: ${license.key} (Plan: ${license.plan})`);
  console.log('Password values were not printed and existing account passwords were preserved.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
