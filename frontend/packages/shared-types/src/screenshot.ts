import { UploadStatus, ImageFormat, ImageQuality } from './enums.js';

export interface IScreenshot {
  id: string;
  companyId: string;
  userId: string;
  deviceId?: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadStatus: UploadStatus;
  driveFileId?: string;
  driveViewUrl?: string;
  capturedAt: string;
  year: number;
  month: number;
  day: number;
}

export interface ISettings {
  screenshotInterval: number; // in seconds
  imageFormat: ImageFormat;
  imageQuality: ImageQuality;
  autoStart: boolean;
  silentMode: boolean;
  deleteAfterUpload: boolean;
}

export interface IUploadQueueItem {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  capturedAt: string;
  year: number;
  month: number;
  day: number;
  status: UploadStatus;
  retryCount: number;
  errorMessage?: string;
}
