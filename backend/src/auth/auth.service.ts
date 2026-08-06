import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LicenseStatus, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordInput, LoginInput, PortalLoginInput } from '@screenadvait/shared-utils';
import { EntitlementService } from '../entitlements/entitlement.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  companyId: string;
  licenseId?: string;
  tokenVersion: number;
  tokenType: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly entitlements: EntitlementService,
    config: ConfigService,
  ) {
    const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret || refreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
    }
    if (refreshSecret === config.get<string>('JWT_SECRET')) {
      throw new Error('JWT refresh and access secrets must be different');
    }
    this.refreshSecret = refreshSecret;
  }

  async login(
    input: LoginInput,
    ipAddress = '127.0.0.1',
    userAgent = 'Desktop Application',
  ) {
    const attemptKey = `${ipAddress}:${input.username.toLowerCase()}`;
    this.consumeAttempt(attemptKey);

    const license = await this.prisma.license.findUnique({
      where: { key: input.licenseKey.toUpperCase() },
      include: { company: true, subscription: true },
    });

    if (!license) {
      throw new UnauthorizedException('Invalid credentials or license');
    }
    const entitlement = await this.entitlements.getLicenseEntitlement(license.id);
    if (!entitlement.active) throw new ForbiddenException(entitlement.message);

    const trimmedUsername = input.username.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        companyId: license.companyId,
        OR: [
          { username: { equals: trimmedUsername, mode: 'insensitive' } },
          { email: { equals: trimmedUsername.toLowerCase(), mode: 'insensitive' } },
        ],
      },
      include: { company: true },
    });

    const passwordValid = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : await bcrypt.compare(input.password, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');

    if (!user || !passwordValid) {
      if (user) await this.writeLoginLog(user.id, ipAddress, userAgent, 'FAILED');
      throw new UnauthorizedException('Invalid credentials or license');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is disabled');
    }

    if (license.userId && license.userId !== user.id) {
      throw new ForbiddenException('This license is assigned to another user');
    }

    if (input.deviceId || input.machineGuid) {
      if (!input.deviceId || !input.machineGuid) {
        throw new ForbiddenException('Complete device identity is required');
      }
      await this.registerOrVerifyDevice(
        license.id,
        user.id,
        input.deviceId,
        input.machineGuid,
        input.os || 'Windows',
        input.computerName || 'WORKSTATION',
        ipAddress,
        license.maxDevices,
      );
    }

    const currentDevices = await this.prisma.device.count({
      where: { licenseId: license.id },
    });
    const verifiedAt = new Date();
    await this.prisma.license.update({
      where: { id: license.id },
      data: { lastVerification: verifiedAt, currentDevices },
    });
    await this.writeLoginLog(user.id, ipAddress, userAgent, 'SUCCESS');
    this.attempts.delete(attemptKey);

    const tokens = await this.issueTokens({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
      licenseId: license.id,
      tokenVersion: user.tokenVersion,
      tokenType: 'access',
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            code: user.company.code,
            contactEmail: user.company.contactEmail,
            contactPhone: user.company.contactPhone,
            maxUsers: user.company.maxUsers,
            maxStorageMb: Number(user.company.maxStorageMb),
          }
        : null,
      licenseStatus: {
        id: license.id,
        key: license.key,
        status: license.status,
        expiryDate: license.expiryDate.toISOString(),
        maxDevices: license.maxDevices,
        currentDevices,
        effectiveStatus: entitlement.effectiveStatus,
        subscriptionStatus: entitlement.subscription.status,
        subscriptionEndDate: entitlement.subscription.endDate.toISOString(),
        effectiveExpiryDate: entitlement.effectiveExpiryDate.toISOString(),
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.licenseId) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    const [user, license] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: payload.sub } }),
      this.prisma.license.findUnique({ where: { id: payload.licenseId } }),
    ]);

    if (
      !user?.isActive ||
      !license ||
      payload.tokenVersion !== user.tokenVersion ||
      license.companyId !== user.companyId ||
      (license.userId && license.userId !== user.id)
    ) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    await this.entitlements.assertLicenseActive(license.id);

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
      licenseId: license.id,
      tokenVersion: user.tokenVersion,
      tokenType: 'access',
    });
  }

  async portalLogin(
    input: PortalLoginInput,
    ipAddress = '127.0.0.1',
    userAgent = 'Web Portal',
  ) {
    const trimmedUsername = input.username.trim();
    const attemptKey = `portal:${ipAddress}:${trimmedUsername.toLowerCase()}`;
    this.consumeAttempt(attemptKey);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: trimmedUsername, mode: 'insensitive' } },
          { email: { equals: trimmedUsername.toLowerCase(), mode: 'insensitive' } },
          {
            role: Role.COMPANY_ADMIN,
            company: { name: { equals: trimmedUsername, mode: 'insensitive' } },
          },
          {
            role: Role.COMPANY_ADMIN,
            company: { code: { equals: trimmedUsername, mode: 'insensitive' } },
          },
        ],
      },
      include: { company: true },
    });
    const passwordValid = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : await bcrypt.compare(
          input.password,
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
        );

    if (!user || !passwordValid) {
      if (user) await this.writeLoginLog(user.id, ipAddress, userAgent, 'FAILED');
      throw new UnauthorizedException('Invalid username or password');
    }
    if (!user.isActive) {
      throw new ForbiddenException('User account is disabled');
    }
    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.COMPANY_ADMIN) {
      await this.writeLoginLog(user.id, ipAddress, userAgent, 'FAILED');
      throw new ForbiddenException('Administrator portal access is required');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        companyId: user.companyId,
        tokenVersion: user.tokenVersion,
        tokenType: 'access',
      },
      { expiresIn: '8h' },
    );
    await this.writeLoginLog(user.id, ipAddress, userAgent, 'SUCCESS');
    this.attempts.delete(attemptKey);

    return {
      accessToken,
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            code: user.company.code,
            contactEmail: user.company.contactEmail,
            contactPhone: user.company.contactPhone,
            maxUsers: user.company.maxUsers,
            maxStorageMb: Number(user.company.maxStorageMb),
          }
        : null,
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
      throw new ForbiddenException('New password must be different from the current password');
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.auditLog.create({
        data: {
          companyId: user.companyId,
          userId,
          action: 'PASSWORD_CHANGED',
          entity: 'User',
          entityId: userId,
        },
      }),
    ]);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  private async issueTokens(base: TokenPayload) {
    const accessPayload: TokenPayload = { ...base, tokenType: 'access' };
    const refreshPayload: TokenPayload = { ...base, tokenType: 'refresh' };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '1d' }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private consumeAttempt(key: string) {
    const now = Date.now();
    const current = this.attempts.get(key);
    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
      return;
    }
    if (current.count >= 5) {
      throw new HttpException(
        'Too many login attempts. Try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    current.count += 1;
  }

  private async registerOrVerifyDevice(
    licenseId: string,
    userId: string,
    deviceId: string,
    machineGuid: string,
    os: string,
    computerName: string,
    ipAddress: string,
    maxDevices: number,
  ) {
    await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.device.findUnique({ where: { deviceId } });
        if (existing) {
          // If the device already exists on this machine, re-bind it to the authenticated user and license
          await tx.device.update({
            where: { id: existing.id },
            data: { userId, licenseId, lastSeenAt: new Date(), ipAddress, os, computerName, machineGuid },
          });
          return;
        }

        const count = await tx.device.count({ where: { licenseId } });
        if (count >= maxDevices) {
          throw new ForbiddenException(
            `Device limit reached (${maxDevices}). Ask your administrator to reset an old device.`,
          );
        }

        await tx.device.create({
          data: {
            userId,
            licenseId,
            deviceId,
            machineGuid,
            os,
            computerName,
            ipAddress,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async writeLoginLog(
    userId: string,
    ipAddress: string,
    userAgent: string,
    status: 'SUCCESS' | 'FAILED',
  ) {
    await this.prisma.loginLog.create({
      data: { userId, ipAddress, userAgent, status },
    });
  }
}
