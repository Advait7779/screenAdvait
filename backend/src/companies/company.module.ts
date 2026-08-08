import { Module } from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CompanyController } from './company.controller.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ScreenshotModule } from '../screenshots/screenshot.module.js';

@Module({
  imports: [ScreenshotModule],
  providers: [CompanyService, RolesGuard],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
