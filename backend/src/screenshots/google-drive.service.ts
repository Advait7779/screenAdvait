import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

export interface StoredScreenshot {
  fileId: string;
  viewUrl: string | null;
  provider: 'google-drive' | 'local';
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly localRoot = path.resolve(
    process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'storage'),
  );
  private driveClient: ReturnType<typeof google.drive> | null = null;
  private driveRootFolderId: string | null = null;

  constructor() {
    this.initDriveClient();
  }

  private initDriveClient() {
    const provider = (process.env.STORAGE_PROVIDER || 'local').trim().toLowerCase();
    if (provider !== 'google-drive') {
      this.logger.log(`Server local disk storage is active at ${this.localRoot}`);
      return;
    }
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken || clientId.startsWith('mock-')) {
      throw new Error(
        'Google Drive API storage requires GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET and GOOGLE_DRIVE_REFRESH_TOKEN',
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_DRIVE_REDIRECT_URI,
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    this.logger.log('Google Drive API storage initialized');
  }

  async uploadScreenshot(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    companyName: string,
    employeeName: string,
    year: number,
    month: number,
    day: number,
  ): Promise<StoredScreenshot> {
    // Structure: Company / DD-MM-YYYY / Employee / screenshot.png
    const formattedDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    const segments = [companyName, formattedDate, employeeName].map((seg) =>
      this.safeSegment(seg),
    );
    const safeFileName = `${Date.now()}-${this.safeSegment(fileName)}`;

    if (!this.driveClient) {
      const directory = path.join(this.localRoot, ...segments);
      await fs.mkdir(directory, { recursive: true });
      const absolutePath = path.join(directory, safeFileName);
      await fs.writeFile(absolutePath, fileBuffer, { flag: 'wx' });
      const relative = path.relative(this.localRoot, absolutePath).split(path.sep).join('/');
      return { fileId: `local:${relative}`, viewUrl: null, provider: 'local' };
    }

    try {
      let parentId: string | undefined = await this.getDriveRootFolderId();
      for (const segment of segments) {
        parentId = await this.ensureDriveFolder(segment, parentId);
      }
      const response = await this.driveClient.files.create({
        requestBody: { name: safeFileName, parents: parentId ? [parentId] : undefined },
        media: { mimeType, body: Readable.from(fileBuffer) },
        fields: 'id,webViewLink',
      });
      if (!response.data.id) throw new Error('Google Drive returned no file ID');
      return {
        fileId: response.data.id,
        viewUrl: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
        provider: 'google-drive',
      };
    } catch (error) {
      this.logger.error('Google Drive upload failed', error);
      throw new ServiceUnavailableException('Cloud storage upload failed; the client will retry');
    }
  }

  async readFile(fileId: string): Promise<Buffer> {
    if (fileId.startsWith('local:')) {
      return fs.readFile(this.resolveLocalFile(fileId));
    }
    if (!this.driveClient) throw new ServiceUnavailableException('Google Drive API is not configured');
    const response = await this.driveClient.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' },
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  async deleteFile(fileId: string) {
    if (fileId.startsWith('local:')) {
      const absolutePath = this.resolveLocalFile(fileId);
      await fs.rm(absolutePath, { force: true });
      await this.pruneEmptyLocalParents(path.dirname(absolutePath), 4);
      return;
    }
    if (this.driveClient) {
      let metadata;
      try {
        metadata = await this.driveClient.files.get({
          fileId,
          fields: 'parents',
        });
      } catch (error) {
        if (this.isNotFound(error)) return;
        throw error;
      }
      try {
        await this.driveClient.files.delete({ fileId });
      } catch (error) {
        if (!this.isNotFound(error)) throw error;
      }
      await this.pruneEmptyDriveParents(metadata.data.parents || [], 4);
    }
  }

  async checkHealth() {
    if (!this.driveClient) {
      await fs.mkdir(this.localRoot, { recursive: true });
      await fs.access(this.localRoot);
      return { provider: 'local', ready: true };
    }
    await this.driveClient.files.list({ pageSize: 1, fields: 'files(id)' });
    return { provider: 'google-drive', ready: true };
  }

  private async pruneEmptyLocalParents(startDirectory: string, maximumLevels: number) {
    let current = path.resolve(startDirectory);
    for (let level = 0; level < maximumLevels; level += 1) {
      const relative = path.relative(this.localRoot, current);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return;
      try {
        if ((await fs.readdir(current)).length > 0) return;
        await fs.rmdir(current);
        current = path.dirname(current);
      } catch {
        return;
      }
    }
  }

  private async pruneEmptyDriveParents(parentIds: string[], maximumLevels: number) {
    let currentParents = [...parentIds];
    for (let level = 0; level < maximumLevels && currentParents.length > 0; level += 1) {
      const nextParents: string[] = [];
      for (const folderId of currentParents) {
        if (folderId === this.driveRootFolderId) continue;
        const children = await this.driveClient!.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: 'files(id)',
          pageSize: 1,
        });
        if (children.data.files?.length) continue;

        const folder = await this.driveClient!.files.get({
          fileId: folderId,
          fields: 'mimeType,parents',
        });
        if (folder.data.mimeType !== 'application/vnd.google-apps.folder') continue;
        await this.driveClient!.files.delete({ fileId: folderId });
        nextParents.push(...(folder.data.parents || []));
      }
      currentParents = [...new Set(nextParents)];
    }
  }

  private async ensureDriveFolder(name: string, parentId?: string): Promise<string> {
    const escaped = name.replace(/['\\]/g, '\\$&');
    const parentClause = parentId ? ` and '${parentId}' in parents` : '';
    const existing = await this.driveClient!.files.list({
      q: `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`,
      fields: 'files(id)',
      pageSize: 1,
    });
    if (existing.data.files?.[0]?.id) return existing.data.files[0].id;
    const created = await this.driveClient!.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id',
    });
    if (!created.data.id) throw new Error(`Could not create Drive folder ${name}`);
    return created.data.id;
  }

  private async getDriveRootFolderId() {
    if (this.driveRootFolderId) return this.driveRootFolderId;
    const configuredId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim();
    this.driveRootFolderId = configuredId
      || await this.ensureDriveFolder(
        process.env.GOOGLE_DRIVE_ROOT_FOLDER_NAME?.trim() || 'ScreenAdvait Screenshots',
      );
    return this.driveRootFolderId;
  }

  private resolveLocalFile(fileId: string) {
    const relative = fileId.slice('local:'.length);
    const absolute = path.resolve(this.localRoot, relative);
    if (!absolute.startsWith(`${this.localRoot}${path.sep}`)) {
      throw new Error('Invalid local storage file ID');
    }
    return absolute;
  }

  private isNotFound(error: unknown) {
    return Number((error as any)?.response?.status || (error as any)?.code) === 404;
  }

  public safeSegment(value: string) {
    const sanitized = value
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^[. ]+|[. ]+$/g, '')
      .slice(0, 100);
    return sanitized || '_';
  }

  async migrateLegacyStorage(prisma: any) {
    const migrationLockId = BigInt('721420260730');
    let acquired = false;
    try {
      const lock = await prisma.$queryRaw`
        SELECT pg_try_advisory_lock(${migrationLockId}) AS acquired
      `;
      acquired = Boolean(lock[0]?.acquired);
      if (!acquired) return;

      const screenshots = await prisma.screenshot.findMany({
        include: { company: true, user: true },
      });

      let migratedCount = 0;
      for (const screenshot of screenshots) {
        if (!screenshot.fileKey?.startsWith('local:')) continue;

        const currentRelative = screenshot.fileKey.slice('local:'.length);
        const fileName = path.basename(currentRelative);

        const capturedDate = new Date(
          new Date(screenshot.capturedAt).getTime()
            + Number(screenshot.timezoneOffsetMinutes || 0) * 60_000,
        );
        const day = String(capturedDate.getUTCDate()).padStart(2, '0');
        const month = String(capturedDate.getUTCMonth() + 1).padStart(2, '0');
        const year = capturedDate.getUTCFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        const companyFolder = this.safeSegment(
          screenshot.company
            ? `${screenshot.company.code}-${screenshot.company.id.slice(0, 8)}`
            : 'Company',
        );
        const userFolder = this.safeSegment(screenshot.user?.username || 'employee');
        const targetRelative = `${companyFolder}/${formattedDate}/${userFolder}/${fileName}`;

        if (currentRelative !== targetRelative) {
          const currentAbsolutePath = path.resolve(this.localRoot, currentRelative);
          const targetAbsolutePath = path.resolve(this.localRoot, targetRelative);

          let fileFoundPath: string | null = null;
          try {
            await fs.stat(currentAbsolutePath);
            fileFoundPath = currentAbsolutePath;
          } catch {
            const altCheck = path.resolve(this.localRoot, '..', currentRelative);
            try {
              await fs.stat(altCheck);
              fileFoundPath = altCheck;
            } catch {
              fileFoundPath = null;
            }
          }

          if (fileFoundPath) {
            await fs.mkdir(path.dirname(targetAbsolutePath), { recursive: true });
            try {
              await fs.rename(fileFoundPath, targetAbsolutePath);
            } catch {
              await fs.copyFile(fileFoundPath, targetAbsolutePath);
              await fs.unlink(fileFoundPath).catch(() => undefined);
            }
            await this.pruneEmptyLocalParents(path.dirname(fileFoundPath), 5);
          }

          const newFileId = `local:${targetRelative}`;
          await prisma.screenshot.update({
            where: { id: screenshot.id },
            data: { fileKey: newFileId, driveFileId: newFileId },
          });
          migratedCount += 1;
        }
      }

      if (migratedCount > 0) {
        this.logger.log(`Migrated ${migratedCount} legacy screenshot(s) to Company/DD-MM-YYYY/Employee format`);
      }
    } catch (error) {
      this.logger.error('Legacy storage migration error', error);
    } finally {
      if (acquired) {
        await prisma.$queryRaw`
          SELECT pg_advisory_unlock(${migrationLockId})
        `.catch((error: unknown) => {
          this.logger.error('Could not release legacy storage migration lock', error);
        });
      }
    }
  }
}
