import { Module } from '@nestjs/common';
import { ScreenshotService } from './screenshot.service.js';
import { GoogleDriveService } from './google-drive.service.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ScreenshotController } from './screenshot.controller.js';
import { ScreenshotRetentionService } from './screenshot-retention.service.js';

@Module({
  providers: [
    ScreenshotService,
    GoogleDriveService,
    ScreenshotRetentionService,
    RolesGuard,
  ],
  controllers: [ScreenshotController],
  exports: [ScreenshotService, GoogleDriveService],
})
export class ScreenshotModule {}
