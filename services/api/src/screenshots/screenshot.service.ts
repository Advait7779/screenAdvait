import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Role, UploadStatus } from '@prisma/client';
import { EntitlementService } from '../entitlements/entitlement.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleDriveService } from './google-drive.service.js';

@Injectable()
export class ScreenshotService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: GoogleDriveService,
    private readonly entitlements: EntitlementService,
  ) {}

  async onModuleInit() {
    void this.storage.migrateLegacyStorage(this.prisma);
  }

  async processUpload(
    file: Express.Multer.File,
    meta: { userId: string; companyId: string; deviceId: string; capturedAt: string },
  ) {
    const capturedDate = new Date(meta.capturedAt);
    if (Number.isNaN(capturedDate.getTime()) || capturedDate.getTime() > Date.now() + 15 * 60_000) {
      throw new BadRequestException('Invalid capture timestamp');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: meta.userId, companyId: meta.companyId, isActive: true },
      include: { company: true },
    });
    if (!user) throw new NotFoundException('Active user not found');

    let device = await this.prisma.device.findFirst({
      where: { deviceId: meta.deviceId, userId: user.id },
      include: { license: true },
    });

    if (!device) {
      const userLicense = await this.prisma.license.findFirst({
        where: { userId: user.id, companyId: user.companyId, status: 'ACTIVE' },
      });
      if (userLicense) {
        const count = await this.prisma.device.count({ where: { licenseId: userLicense.id } });
        if (count < userLicense.maxDevices) {
          const created = await this.prisma.device.create({
            data: {
              userId: user.id,
              licenseId: userLicense.id,
              deviceId: meta.deviceId,
              machineGuid: meta.deviceId.replace('dev_', ''),
              os: 'Windows',
              computerName: 'WORKSTATION',
            },
          });
          device = { ...created, license: userLicense };
        }
      }
    }

    if (
      !device ||
      device.license.companyId !== user.companyId
    ) {
      throw new ForbiddenException('Device is not activated under a valid license');
    }
    const entitlement = await this.entitlements.assertLicenseActive(device.license.id);

    const usage = await this.prisma.screenshot.aggregate({
      where: { companyId: user.companyId },
      _sum: { fileSize: true },
    });
    const quotaBytes = entitlement.subscription.maxStorageMb * BigInt(1024 * 1024);
    if ((usage._sum.fileSize || BigInt(0)) + BigInt(file.size) > quotaBytes) {
      throw new ForbiddenException('Company screenshot storage quota exceeded');
    }

    const year = capturedDate.getFullYear();
    const month = capturedDate.getMonth() + 1;
    const day = capturedDate.getDate();
    const stored = await this.storage.uploadScreenshot(
      file.buffer,
      file.originalname,
      file.mimetype,
      user.company.name,
      user.username,
      year,
      month,
      day,
    );

    try {
      const screenshot = await this.prisma.screenshot.create({
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
          capturedAt: capturedDate,
          year,
          month,
          day,
        },
      });

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
    } catch (error) {
      await this.storage.deleteFile(stored.fileId).catch(() => undefined);
      throw error;
    }
  }

  async getMyScreenshots(userId: string) {
    const screenshots = await this.prisma.screenshot.findMany({
      where: { userId },
      orderBy: { capturedAt: 'desc' },
      take: 100,
    });
    return screenshots.map((s) => this.toResponse(s));
  }

  async getCompanyScreenshots(companyId: string) {
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
      orderBy: { capturedAt: 'desc' },
      take: 200,
    });
    return screenshots.map((s) => this.toResponse(s));
  }

  async getFile(
    screenshotId: string,
    requester: { id: string; companyId: string; role: Role },
  ) {
    const screenshot = await this.prisma.screenshot.findUnique({ where: { id: screenshotId } });
    if (!screenshot) throw new NotFoundException('Screenshot not found');
    const permitted =
      requester.role === Role.SUPER_ADMIN ||
      (requester.role === Role.COMPANY_ADMIN && screenshot.companyId === requester.companyId) ||
      (requester.role === Role.EMPLOYEE && screenshot.userId === requester.id);
    if (!permitted) throw new ForbiddenException('You cannot access this screenshot');
    return {
      buffer: await this.storage.readFile(screenshot.driveFileId || screenshot.fileKey),
      mimeType: screenshot.mimeType,
      fileName: screenshot.fileName,
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
}
