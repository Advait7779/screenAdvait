import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Role, UploadStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { EntitlementService } from '../entitlements/entitlement.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleDriveService } from './google-drive.service.js';
import { decryptText } from '../common/crypto.util.js';

@Injectable()
export class ScreenshotService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: GoogleDriveService,
    private readonly entitlements: EntitlementService,
  ) {}

  async onModuleInit() {
    await this.storage.migrateLegacyStorage(this.prisma);
  }

  async processUpload(
    file: Express.Multer.File,
    meta: {
      userId: string;
      companyId: string;
      deviceId: string;
      capturedAt: string;
      idempotencyKey: string;
      timezoneOffsetMinutes: number;
    },
  ) {
    this.assertImageSignature(file.buffer, file.mimetype);
    const capturedDate = new Date(meta.capturedAt);
    if (Number.isNaN(capturedDate.getTime()) || capturedDate.getTime() > Date.now() + 15 * 60_000) {
      throw new BadRequestException('Invalid capture timestamp');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: meta.userId, companyId: meta.companyId, isActive: true },
      include: { company: true },
    });
    if (!user) throw new NotFoundException('Active user not found');

    const normalizedIdempotencyKey = crypto
      .createHash('sha256')
      .update(`${meta.userId}:${meta.idempotencyKey}`)
      .digest('hex');
    const existingUpload = await this.prisma.screenshot.findUnique({
      where: { idempotencyKey: normalizedIdempotencyKey },
    });
    if (existingUpload) return this.toUploadResponse(existingUpload);

    const device = await this.prisma.device.findFirst({
      where: { deviceId: meta.deviceId, userId: user.id },
      include: { license: true },
    });

    if (
      !device ||
      device.license.companyId !== user.companyId
    ) {
      throw new ForbiddenException('Device is not activated under a valid license');
    }
    const entitlement = await this.entitlements.assertLicenseActive(device.license.id);
    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    const quotaBytes = entitlement.subscription.maxStorageMb * BigInt(1024 * 1024);
    const localCaptureDate = new Date(
      capturedDate.getTime() + meta.timezoneOffsetMinutes * 60_000,
    );
    const year = localCaptureDate.getUTCFullYear();
    const month = localCaptureDate.getUTCMonth() + 1;
    const day = localCaptureDate.getUTCDate();
    let storedFileId: string | null = null;

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`
            SELECT pg_advisory_xact_lock(hashtextextended(${user.companyId}, 0))
          `;

          const duplicate = await tx.screenshot.findUnique({
            where: { idempotencyKey: normalizedIdempotencyKey },
          });
          if (duplicate) return this.toUploadResponse(duplicate);

          const usage = await tx.screenshot.aggregate({
            where: { companyId: user.companyId },
            _sum: { fileSize: true },
          });
          if ((usage._sum.fileSize || BigInt(0)) + BigInt(file.size) > quotaBytes) {
            throw new ForbiddenException('Company screenshot storage quota exceeded');
          }

          const stored = await this.storage.uploadScreenshot(
            file.buffer,
            file.originalname,
            file.mimetype,
            `${user.company.code}-${user.company.id.slice(0, 8)}`,
            user.username,
            year,
            month,
            day,
          );
          storedFileId = stored.fileId;

          const screenshot = await tx.screenshot.create({
            data: {
              companyId: user.companyId,
              userId: user.id,
              deviceId: device.id,
              fileKey: stored.fileId,
              fileName: file.originalname,
              fileSize: BigInt(file.size),
              mimeType: file.mimetype,
              uploadStatus: UploadStatus.COMPLETED,
              driveFileId: stored.fileId,
              driveViewUrl: stored.viewUrl,
              idempotencyKey: normalizedIdempotencyKey,
              capturedAt: capturedDate,
              timezoneOffsetMinutes: meta.timezoneOffsetMinutes,
              year,
              month,
              day,
            },
          });
          return this.toUploadResponse(screenshot);
        },
        { maxWait: 10_000, timeout: 45_000 },
      );
    } catch (error) {
      if (storedFileId) {
        await this.storage.deleteFile(storedFileId).catch(() => undefined);
      }
      throw error;
    }
  }

  async getMyScreenshots(userId: string, cursor?: string, limit = 500) {
    const screenshots = await this.prisma.screenshot.findMany({
      where: { userId },
      orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return this.toPage(screenshots, limit);
  }

  async getCompanyScreenshots(companyId: string, cursor?: string, limit = 500) {
    const screenshots = await this.prisma.screenshot.findMany({
      where: { companyId },
      select: {
        id: true,
        companyId: true,
        userId: true,
        deviceId: true,
        fileKey: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadStatus: true,
        driveFileId: true,
        driveViewUrl: true,
        capturedAt: true,
        year: true,
        month: true,
        day: true,
        createdAt: true,
        user: { select: { id: true, username: true, fullName: true } },
        device: { select: { id: true, deviceId: true, os: true, computerName: true } },
      },
      orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return this.toPage(screenshots, limit);
  }

  async getFile(
    screenshotId: string,
    requester: { id: string; companyId: string; role: Role },
  ) {
    const screenshot = await this.prisma.screenshot.findUnique({ where: { id: screenshotId } });
    if (!screenshot) throw new NotFoundException('Screenshot record not found');
    const permitted =
      requester.role === Role.SUPER_ADMIN ||
      (requester.role === Role.COMPANY_ADMIN && screenshot.companyId === requester.companyId) ||
      (requester.role === Role.EMPLOYEE && screenshot.userId === requester.id);
    if (!permitted) throw new ForbiddenException('You cannot access this screenshot');

    const fileId = screenshot.driveFileId || screenshot.fileKey;
    const isLocalFile = fileId.startsWith('local:');

    // Attempt to stream the file
    try {
      const buffer = await this.storage.readFile(fileId, screenshot.companyId);
      return {
        buffer,
        mimeType: screenshot.mimeType,
        fileName: screenshot.fileName,
      };
    } catch (streamError: any) {
      // Streaming failed — try redirect fallbacks
      console.error(`[getFile] Failed to stream screenshot ${screenshotId}: fileId=${fileId}, isLocal=${isLocalFile}, error=${streamError?.message}`);
    }

    // Fallback 1: redirect to stored driveViewUrl
    if (screenshot.driveViewUrl) {
      return {
        redirectUrl: screenshot.driveViewUrl,
        mimeType: screenshot.mimeType,
        fileName: screenshot.fileName,
      };
    }

    // Fallback 2: construct Google Drive view URL from driveFileId (only if it looks like a Drive ID)
    if (screenshot.driveFileId && !screenshot.driveFileId.startsWith('local:') && !screenshot.driveFileId.includes('/')) {
      return {
        redirectUrl: `https://drive.google.com/file/d/${screenshot.driveFileId}/view`,
        mimeType: screenshot.mimeType,
        fileName: screenshot.fileName,
      };
    }

    // Fallback 3: construct from fileKey if different from driveFileId
    if (screenshot.fileKey && screenshot.fileKey !== screenshot.driveFileId && !screenshot.fileKey.startsWith('local:') && !screenshot.fileKey.includes('/')) {
      return {
        redirectUrl: `https://drive.google.com/file/d/${screenshot.fileKey}/view`,
        mimeType: screenshot.mimeType,
        fileName: screenshot.fileName,
      };
    }

    throw new NotFoundException('Screenshot image file is missing or deleted from storage');
  }

  async debugScreenshot(
    screenshotId: string,
    requester: { id: string; companyId: string; role: Role },
  ) {
    if (requester.role !== Role.SUPER_ADMIN && requester.role !== Role.COMPANY_ADMIN) {
      throw new ForbiddenException('Admin only');
    }
    const screenshot = await this.prisma.screenshot.findUnique({ where: { id: screenshotId } });
    if (!screenshot) throw new NotFoundException('Screenshot record not found');
    if (requester.role === Role.COMPANY_ADMIN && screenshot.companyId !== requester.companyId) {
      throw new ForbiddenException('Not your company');
    }

    const fileId = screenshot.driveFileId || screenshot.fileKey;
    const isLocalFile = fileId.startsWith('local:');
    const storageRoots = this.storage.getStorageRoots();
    const pathsTried: { root: string; fullPath: string; exists: boolean }[] = [];

    if (isLocalFile) {
      const relative = fileId.replace(/^local:/, '');
      for (const root of storageRoots) {
        const full = require('path').resolve(root, relative);
        let exists = false;
        try {
          const stat = require('fs').statSync(full);
          exists = stat.isFile();
        } catch {}
        pathsTried.push({ root, fullPath: full, exists });
      }
    }

    const conn = await this.prisma.googleDriveConnection.findUnique({
      where: { companyId: screenshot.companyId },
    });

    return {
      screenshotId: screenshot.id,
      fileKey: screenshot.fileKey,
      driveFileId: screenshot.driveFileId,
      driveViewUrl: screenshot.driveViewUrl,
      isLocalFile,
      companyId: screenshot.companyId,
      companyHasDriveConnection: !!conn,
      cwd: process.cwd(),
      localRoot: this.storage.getLocalRoot(),
      storageRoots,
      pathsTried,
      envStorageProvider: process.env.STORAGE_PROVIDER || 'local',
      envLocalStoragePath: process.env.LOCAL_STORAGE_PATH || '(not set)',
    };
  }

  private toResponse<T extends { id: string; fileSize: bigint }>(screenshot: T) {
    const { fileKey: _fileKey, driveFileId: _driveFileId, ...safe } = screenshot as T & {
      fileKey?: string;
      driveFileId?: string | null;
    };
    return {
      ...safe,
      fileSize: Number(screenshot.fileSize),
      fileUrl: `/api/v1/screenshots/${screenshot.id}/file`,
    };
  }

  private toUploadResponse(screenshot: any) {
    return {
      id: screenshot.id,
      fileName: screenshot.fileName,
      fileSize: Number(screenshot.fileSize),
      uploadStatus: screenshot.uploadStatus,
      driveFileId: screenshot.driveFileId,
      driveViewUrl: screenshot.driveViewUrl,
      fileUrl: `/api/v1/screenshots/${screenshot.id}/file`,
      capturedAt: screenshot.capturedAt,
    };
  }

  private toPage<T extends { id: string; fileSize: bigint }>(
    screenshots: T[],
    limit: number,
  ) {
    const hasMore = screenshots.length > limit;
    const items = hasMore ? screenshots.slice(0, limit) : screenshots;
    return {
      items: items.map((item) => this.toResponse(item)),
      nextCursor: hasMore ? items[items.length - 1]?.id || null : null,
    };
  }

  private assertImageSignature(buffer: Buffer, mimeType: string) {
    const png =
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const jpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const webp =
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    const valid =
      (mimeType === 'image/png' && png) ||
      (mimeType === 'image/jpeg' && jpeg) ||
      (mimeType === 'image/webp' && webp);
    if (!valid) throw new BadRequestException('File content does not match the declared image type');
  }

  async getCompanyDriveConfig(companyId: string) {
    const conn = await this.prisma.googleDriveConnection.findUnique({
      where: { companyId },
    });
    if (!conn) {
      const systemClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
      const systemClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      const systemRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
      if (systemClientId && systemClientSecret && systemRefreshToken && !systemClientId.startsWith('mock-')) {
        return {
          enabled: true,
          provider: 'google-drive',
          clientId: systemClientId,
          clientSecret: systemClientSecret,
          refreshToken: systemRefreshToken,
          rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null,
          rootFolderName: process.env.GOOGLE_DRIVE_ROOT_FOLDER_NAME || 'ScreenAdvait Screenshots',
        };
      }
      return { enabled: false, provider: 'none' };
    }

    try {
      const decryptedJson = decryptText(conn.refreshTokenEncrypted);
      const parsed = JSON.parse(decryptedJson);
      return {
        enabled: true,
        provider: 'google-drive',
        clientId:
          parsed.clientId ||
          process.env.GOOGLE_DRIVE_CLIENT_ID ||
          '407408718192.apps.googleusercontent.com',
        clientSecret:
          parsed.clientSecret || process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
        refreshToken: parsed.refreshToken,
        rootFolderId: conn.rootFolderId,
        rootFolderName: conn.rootFolderName,
      };
    } catch (e) {
      return { enabled: false, provider: 'none', error: 'Failed to decrypt drive connection' };
    }
  }

  async processDirectMetadata(meta: {
    userId: string;
    companyId: string;
    deviceId: string;
    capturedAt: string;
    idempotencyKey: string;
    timezoneOffsetMinutes: number;
    driveFileId: string;
    driveViewUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) {
    const capturedDate = new Date(meta.capturedAt);
    if (Number.isNaN(capturedDate.getTime()) || capturedDate.getTime() > Date.now() + 15 * 60_000) {
      throw new BadRequestException('Invalid capture timestamp');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: meta.userId, companyId: meta.companyId, isActive: true },
      include: { company: true },
    });
    if (!user) throw new NotFoundException('Active user not found');

    const normalizedIdempotencyKey = crypto
      .createHash('sha256')
      .update(`${meta.userId}:${meta.idempotencyKey}`)
      .digest('hex');

    const existingUpload = await this.prisma.screenshot.findUnique({
      where: { idempotencyKey: normalizedIdempotencyKey },
    });
    if (existingUpload) return this.toUploadResponse(existingUpload);

    const device = await this.prisma.device.findFirst({
      where: { deviceId: meta.deviceId, userId: user.id },
      include: { license: true },
    });

    if (!device || device.license.companyId !== user.companyId) {
      throw new ForbiddenException('Device is not activated under a valid license');
    }

    await this.entitlements.assertLicenseActive(device.license.id);
    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    const localCaptureDate = new Date(
      capturedDate.getTime() + meta.timezoneOffsetMinutes * 60_000,
    );
    const year = localCaptureDate.getUTCFullYear();
    const month = localCaptureDate.getUTCMonth() + 1;
    const day = localCaptureDate.getUTCDate();

    const screenshot = await this.prisma.screenshot.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        deviceId: device.id,
        fileKey: meta.driveFileId,
        fileName: meta.fileName,
        fileSize: BigInt(meta.fileSize),
        mimeType: meta.mimeType || 'image/png',
        uploadStatus: UploadStatus.COMPLETED,
        driveFileId: meta.driveFileId,
        driveViewUrl: meta.driveViewUrl,
        idempotencyKey: normalizedIdempotencyKey,
        capturedAt: capturedDate,
        timezoneOffsetMinutes: meta.timezoneOffsetMinutes,
        year,
        month,
        day,
      },
    });

    return this.toUploadResponse(screenshot);
  }
}
