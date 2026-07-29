import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompanyInput } from '@screenadvait/shared-utils';
import { LicensePlan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async createCompany(input: CreateCompanyInput) {
    const existing = await this.prisma.company.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new ConflictException('Company code already exists');
    }

    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 365); // 1 year default active subscription

    const maxUsers = input.maxUsers || 10;
    const maxStorageMb = BigInt(input.maxStorageMb || 10240);

    const company = await this.prisma.company.create({
      data: {
        name: input.name,
        code: input.code,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        maxUsers,
        maxStorageMb,
        users: {
          create: {
            email: input.contactEmail,
            username: input.code.toLowerCase(),
            fullName: `${input.name} Admin`,
            passwordHash,
            role: 'COMPANY_ADMIN',
          },
        },
        subscriptions: {
          create: {
            plan: LicensePlan.ONE_YEAR,
            status: SubscriptionStatus.ACTIVE,
            startDate,
            endDate,
            maxEmployees: maxUsers,
            maxDevices: maxUsers,
            maxStorageMb,
          },
        },
      },
    });
    return { ...company, maxStorageMb: Number(company.maxStorageMb) };
  }

  async getAllCompanies() {
    const companies = await this.prisma.company.findMany({
      include: {
        _count: { select: { users: true, licenses: true, screenshots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((c) => ({
      ...c,
      maxStorageMb: Number(c.maxStorageMb),
    }));
  }
}
