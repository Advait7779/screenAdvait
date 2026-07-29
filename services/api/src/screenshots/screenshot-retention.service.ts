import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleDriveService } from './google-drive.service.js';
import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_RETENTION_DAYS = 7;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 500;

@Injectable()
export class ScreenshotRetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScreenshotRetentionService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: GoogleDriveService,
  ) {}

  onModuleInit() {
    void this.runCleanupSafely();
    this.cleanupTimer = setInterval(
      () => void this.runCleanupSafely(),
      CLEANUP_INTERVAL_MS,
    );
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cleanupTimer = null;
  }

  async cleanupExpiredScreenshots(now = new Date()) {
    const retentionDays = this.getRetentionDays();
    const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    const expired = await this.prisma.screenshot.findMany({
      where: { capturedAt: { lt: cutoff } },
      orderBy: { capturedAt: 'asc' },
      take: CLEANUP_BATCH_SIZE,
      select: {
        id: true,
        companyId: true,
        fileKey: true,
        driveFileId: true,
      },
    });

    let deleted = 0;
    for (const screenshot of expired) {
      try {
        await this.storage.deleteFile(screenshot.driveFileId || screenshot.fileKey);
        await this.prisma.screenshot.delete({ where: { id: screenshot.id } });
        deleted += 1;
      } catch (error) {
        this.logger.error(
          `Could not delete expired screenshot ${screenshot.id}; it will be retried`,
          error,
        );
      }
    }

    if (deleted > 0) {
      this.logger.log(
        `Deleted ${deleted} screenshot(s) older than ${retentionDays} days`,
      );
    }
    await this.cleanupLegacyStorage(cutoff);
    return deleted;
  }

  private async cleanupLegacyStorage(cutoff: Date) {
    const legacyRoot = path.resolve(process.cwd(), 'storage');
    const activeRoot = path.resolve(
      process.env.LOCAL_STORAGE_PATH || legacyRoot,
    );
    if (legacyRoot === activeRoot) return;

    let removedFiles = 0;
    const visit = async (directory: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.readdir(directory, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await visit(absolutePath);
          continue;
        }
        if (!entry.isFile() || !/\.(png|jpe?g|webp)$/i.test(entry.name)) continue;
        try {
          const stats = await fs.stat(absolutePath);
          if (stats.mtime < cutoff) {
            await fs.rm(absolutePath, { force: true });
            removedFiles += 1;
          }
        } catch {
          // A later hourly pass will retry files that are temporarily unavailable.
        }
      }
      if (directory !== legacyRoot) {
        try {
          if ((await fs.readdir(directory)).length === 0) await fs.rmdir(directory);
        } catch {
          // The directory is still in use or no longer empty.
        }
      }
    };

    await visit(legacyRoot);
    if (removedFiles > 0) {
      this.logger.log(`Deleted ${removedFiles} expired legacy screenshot backup(s)`);
    }
  }

  private async runCleanupSafely() {
    try {
      await this.cleanupExpiredScreenshots();
    } catch (error) {
      this.logger.error('Automatic screenshot cleanup will retry later', error);
    }
  }

  private getRetentionDays() {
    const configured = Number.parseInt(process.env.SCREENSHOT_RETENTION_DAYS || '', 10);
    return Number.isInteger(configured) && configured > 0
      ? configured
      : DEFAULT_RETENTION_DAYS;
  }
}
