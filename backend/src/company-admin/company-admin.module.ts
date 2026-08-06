import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard.js';
import { CompanyAdminController } from './company-admin.controller.js';
import { CompanyAdminService } from './company-admin.service.js';

@Module({
  providers: [CompanyAdminService, RolesGuard],
  controllers: [CompanyAdminController],
})
export class CompanyAdminModule {}
