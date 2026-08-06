import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompanyInput } from '@screenadvait/shared-utils';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async createCompany(input: CreateCompanyInput, createdByUserId: string) {
    const existing = await this.prisma.company.findFirst({
      where: {
        OR: [
          { code: input.code },
          { name: { equals: input.name.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('A company with this name or code already exists');
    }

    const temporaryPassword = `${crypto.randomBytes(18).toString('base64url')}Aa1!`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const maxUsers = input.maxUsers || 10;

    let company;
    try {
      company = await this.prisma.$transaction(async (tx) => {
        const created = await tx.company.create({
          data: {
            name: input.name,
            code: input.code,
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone,
            maxUsers,
            users: {
              create: {
                email: input.contactEmail,
                username: input.code.toLowerCase(),
                fullName: `${input.name} Admin`,
                passwordHash,
                role: 'COMPANY_ADMIN',
              },
            },
          },
        });
        await tx.auditLog.create({
          data: {
            companyId: created.id,
            userId: createdByUserId,
            action: 'COMPANY_CREATED',
            entity: 'Company',
            entityId: created.id,
            details: { code: created.code },
          },
        });
        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Company code, administrator username, or email already exists');
      }
      throw error;
    }
    return {
      ...company,
      maxStorageMb: Number(company.maxStorageMb),
      adminCredentials: {
        username: input.code.toLowerCase(),
        temporaryPassword,
      },
    };
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

  async resetCompanyAdminPassword(
    companyId: string,
    superAdminUserId: string,
    customPassword?: string,
  ) {
    const adminUser = await this.prisma.user.findFirst({
      where: { companyId, role: Role.COMPANY_ADMIN },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      throw new NotFoundException('Company Administrator account not found for this company');
    }

    const passwordToSet = customPassword?.trim() || `${crypto.randomBytes(12).toString('base64url')}Aa1!`;
    const passwordHash = await bcrypt.hash(passwordToSet, 12);

    await this.prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId: superAdminUserId,
        action: 'COMPANY_ADMIN_PASSWORD_RESET',
        entity: 'User',
        entityId: adminUser.id,
      },
    });

    return {
      success: true,
      username: adminUser.username,
      email: adminUser.email,
      temporaryPassword: passwordToSet,
    };
  }
}
