import { Module } from '@nestjs/common';
import { LicenseService } from './license.service.js';
import { LicenseController } from './license.controller.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  providers: [LicenseService, RolesGuard],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
