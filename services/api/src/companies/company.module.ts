import { Module } from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CompanyController } from './company.controller.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  providers: [CompanyService, RolesGuard],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
