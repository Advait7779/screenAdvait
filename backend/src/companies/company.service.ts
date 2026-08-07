import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompanyInput } from '@screenadvait/shared-utils';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export type CreateCompanyParams = CreateCompanyInput & {
  adminUsername?: string;
  adminPassword?: string;
};

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async createCompany(input: CreateCompanyParams, createdByUserId: string) {
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

    const desiredUsername = (input.adminUsername && input.adminUsername.trim().length >= 3)
      ? input.adminUsername.trim()
      : input.code.toLowerCase();
    const temporaryPassword = (input.adminPassword && input.adminPassword.trim().length >= 6)
      ? input.adminPassword.trim()
      : `${crypto.randomBytes(12).toString('base64url')}Aa1!`;
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
                username: desiredUsername,
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
            details: { code: created.code, username: desiredUsername },
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
        username: desiredUsername,
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

    if (customPassword && customPassword.trim().length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
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

  async deleteCompany(companyId: string, superAdminUserId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: { select: { users: true, licenses: true, screenshots: true, subscriptions: true } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Don't allow deleting DEMO company (system default)
    if (company.code === 'DEMO') {
      throw new BadRequestException('Cannot delete the system default Demo company');
    }

    // Collect screenshot file keys for disk cleanup
    const screenshots = await this.prisma.screenshot.findMany({
      where: { companyId },
      select: { fileKey: true },
    });

    const deletedCounts = {
      users: company._count.users,
      licenses: company._count.licenses,
      screenshots: company._count.screenshots,
      subscriptions: company._count.subscriptions,
    };

    // Delete all child records in dependency order inside a transaction
    await this.prisma.$transaction(async (tx) => {
      const companyUsers = await tx.user.findMany({
        where: { companyId },
        select: { id: true },
      });
      const userIds = companyUsers.map((u) => u.id);

      // 1. Audit logs
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { companyId },
            ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ],
        },
      });

      // 2. User settings & login logs
      if (userIds.length > 0) {
        await tx.loginLog.deleteMany({ where: { userId: { in: userIds } } });
        await tx.setting.deleteMany({ where: { userId: { in: userIds } } });
      }

      // 3. Screenshots
      await tx.screenshot.deleteMany({ where: { companyId } });

      // 4. Devices & License histories
      const companyLicenses = await tx.license.findMany({
        where: { companyId },
        select: { id: true },
      });
      const licenseIds = companyLicenses.map((l) => l.id);
      if (licenseIds.length > 0) {
        await tx.device.deleteMany({ where: { licenseId: { in: licenseIds } } });
        await tx.licenseHistory.deleteMany({ where: { licenseId: { in: licenseIds } } });
      }

      // 5. Licenses & Subscriptions
      await tx.license.deleteMany({ where: { companyId } });
      await tx.subscription.deleteMany({ where: { companyId } });

      // 6. Payments & Invoices
      const companyInvoices = await tx.invoice.findMany({
        where: { companyId },
        select: { id: true },
      });
      const invoiceIds = companyInvoices.map((i) => i.id);
      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      }
      await tx.invoice.deleteMany({ where: { companyId } });

      // 7. Reports & Drive Connection
      await tx.report.deleteMany({ where: { companyId } });
      await tx.googleDriveConnection.deleteMany({ where: { companyId } });

      // 8. Users
      await tx.user.deleteMany({ where: { companyId } });

      // 9. Company
      await tx.company.delete({ where: { id: companyId } });
    });

    // Clean up screenshot files from disk (non-blocking)
    const fs = await import('fs');
    const path = await import('path');
    const storagePath = process.env.LOCAL_STORAGE_PATH || './storage';
    for (const ss of screenshots) {
      try {
        const fullPath = path.resolve(storagePath, ss.fileKey);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Ignore file cleanup errors
      }
    }

    return {
      success: true,
      deletedCompany: company.name,
      deletedCode: company.code,
      deletedCounts,
    };
  }
}
