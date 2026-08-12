import { Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface SuperAdminProvisionInput {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

interface SuperAdminUserRecord {
  id: string;
  username: string;
  email: string;
}

interface SuperAdminProvisionClient {
  user: {
    findMany(args: unknown): Promise<SuperAdminUserRecord[]>;
    create(args: unknown): Promise<SuperAdminUserRecord>;
    update(args: unknown): Promise<SuperAdminUserRecord>;
  };
  $transaction<T>(
    callback: (transaction: SuperAdminProvisionClient) => Promise<T>,
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<T>;
}

export interface SuperAdminProvisionResult extends SuperAdminUserRecord {
  created: boolean;
}

function normalizeInput(input: SuperAdminProvisionInput) {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const fullName = input.fullName?.trim() || 'Super Administrator';

  if (username.length < 3) {
    throw new Error('SUPERADMIN_USERNAME must contain at least 3 characters');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('SUPERADMIN_EMAIL must be a valid email address');
  }
  if (password.length < 6) {
    throw new Error('SUPERADMIN_PASSWORD must contain at least 6 characters');
  }

  return { username, email, password, fullName };
}

export async function provisionSuperAdmin(
  prisma: SuperAdminProvisionClient,
  input: SuperAdminProvisionInput,
  hashPassword: (password: string) => Promise<string> = (password) => bcrypt.hash(password, 12),
): Promise<SuperAdminProvisionResult> {
  const normalized = normalizeInput(input);
  const passwordHash = await hashPassword(normalized.password);

  return prisma.$transaction(
    async (transaction) => {
      const matches = await transaction.user.findMany({
        where: {
          OR: [
            { username: { equals: normalized.username, mode: 'insensitive' } },
            { email: { equals: normalized.email, mode: 'insensitive' } },
          ],
        },
        select: { id: true, username: true, email: true },
      });

      const distinctIds = new Set(matches.map((user) => user.id));
      if (distinctIds.size > 1) {
        throw new Error(
          'SUPERADMIN_USERNAME and SUPERADMIN_EMAIL belong to different users; resolve the conflict before provisioning',
        );
      }

      const existing = matches[0];
      if (existing) {
        const user = await transaction.user.update({
          where: { id: existing.id },
          data: {
            username: normalized.username,
            email: normalized.email,
            fullName: normalized.fullName,
            passwordHash,
            role: Role.SUPER_ADMIN,
            isActive: true,
            tokenVersion: { increment: 1 },
          },
          select: { id: true, username: true, email: true },
        });
        return { ...user, created: false };
      }

      const user = await transaction.user.create({
        data: {
          companyId: null,
          username: normalized.username,
          email: normalized.email,
          fullName: normalized.fullName,
          passwordHash,
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
        select: { id: true, username: true, email: true },
      });
      return { ...user, created: true };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await provisionSuperAdmin(prisma as unknown as SuperAdminProvisionClient, {
      username: process.env.SUPERADMIN_USERNAME || 'superadmin',
      email: process.env.SUPERADMIN_EMAIL || 'superadmin@system.com',
      password: process.env.SUPERADMIN_PASSWORD || '',
      fullName: process.env.SUPERADMIN_FULL_NAME,
    });
    const action = result.created ? 'created' : 'updated';
    console.log(`SuperAdmin ${action} successfully: ${result.username} (${result.email})`);
    console.log('Existing sessions for an updated account have been invalidated.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error) => {
    console.error(`SuperAdmin provisioning failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
