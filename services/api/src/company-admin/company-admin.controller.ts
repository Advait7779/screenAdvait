import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import {
  CreateEmployeeLicenseInput,
  CreateEmployeeLicenseSchema,
  CreateManagedEmployeeInput,
  CreateManagedEmployeeSchema,
  EmployeeStatusSchema,
  ResetEmployeePasswordSchema,
} from '@screenadvait/shared-utils';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { CompanyAdminService } from './company-admin.service.js';

@Controller('v1/company-admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.COMPANY_ADMIN)
export class CompanyAdminController {
  constructor(private readonly companyAdmin: CompanyAdminService) {}

  @Get('overview')
  overview(@Req() req: any) {
    return this.companyAdmin.overview(req.user.companyId);
  }

  @Post('employees')
  createEmployee(
    @Body(new ZodValidationPipe(CreateManagedEmployeeSchema))
    body: CreateManagedEmployeeInput,
    @Req() req: any,
  ) {
    return this.companyAdmin.createEmployee(req.user.companyId, req.user.id, body);
  }

  @Post('employees/:employeeId/license')
  createLicense(
    @Param('employeeId') employeeId: string,
    @Body(new ZodValidationPipe(CreateEmployeeLicenseSchema))
    body: CreateEmployeeLicenseInput,
    @Req() req: any,
  ) {
    return this.companyAdmin.createEmployeeLicense(
      req.user.companyId,
      req.user.id,
      employeeId,
      body,
    );
  }

  @Post('employees/:employeeId/status')
  setEmployeeStatus(
    @Param('employeeId') employeeId: string,
    @Body(new ZodValidationPipe(EmployeeStatusSchema)) body: { isActive: boolean },
    @Req() req: any,
  ) {
    return this.companyAdmin.setEmployeeStatus(
      req.user.companyId,
      req.user.id,
      employeeId,
      body.isActive,
    );
  }

  @Post('employees/:employeeId/reset-password')
  resetEmployeePassword(
    @Param('employeeId') employeeId: string,
    @Body(new ZodValidationPipe(ResetEmployeePasswordSchema))
    body: { newPassword: string },
    @Req() req: any,
  ) {
    return this.companyAdmin.resetEmployeePassword(
      req.user.companyId,
      req.user.id,
      employeeId,
      body.newPassword,
    );
  }

  @Post('licenses/:licenseId/reset-devices')
  resetDevices(@Param('licenseId') licenseId: string, @Req() req: any) {
    return this.companyAdmin.resetDevices(req.user.companyId, req.user.id, licenseId);
  }

  @Post('licenses/:licenseId/revoke')
  revoke(@Param('licenseId') licenseId: string, @Req() req: any) {
    return this.companyAdmin.revokeLicense(req.user.companyId, req.user.id, licenseId);
  }

  @Post('licenses/:licenseId/reactivate')
  reactivate(@Param('licenseId') licenseId: string, @Req() req: any) {
    return this.companyAdmin.reactivateEmployeeLicense(req.user.companyId, req.user.id, licenseId);
  }
}
