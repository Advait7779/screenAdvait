import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LicenseService } from './license.service.js';
import { AuthGuard } from '@nestjs/passport';
import {
  GenerateLicenseInput,
  GenerateLicenseSchema,
  RenewLicenseInput,
  RenewLicenseSchema,
  VerifyLicenseSchema,
} from '@screenadvait/shared-utils';
import { Role } from '@prisma/client';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('v1/licenses')
export class LicenseController {
  constructor(private licenseService: LicenseService) {}

  @Post('verify')
  async verifyLicense(
    @Body(new ZodValidationPipe(VerifyLicenseSchema))
    body: { licenseKey: string; deviceId: string; machineGuid: string },
  ) {
    return this.licenseService.verifyLicense(body.licenseKey, body.deviceId, body.machineGuid);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get()
  async getAllLicenses() {
    return this.licenseService.getAllLicenses();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.EMPLOYEE)
  @Get('current-status')
  async getCurrentStatus(@Req() req: any) {
    if (!req.user.tokenLicenseId) {
      return {
        active: false,
        effectiveStatus: 'UNLICENSED',
        message: 'No employee license is associated with this session',
      };
    }
    return this.licenseService.getCurrentStatus(req.user.tokenLicenseId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('generate')
  async generateLicense(
    @Body(new ZodValidationPipe(GenerateLicenseSchema)) body: GenerateLicenseInput,
    @Req() req: any,
  ) {
    return this.licenseService.generateLicense(body, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post(':id/renew')
  async renewLicense(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RenewLicenseSchema)) body: RenewLicenseInput,
    @Req() req: any,
  ) {
    return this.licenseService.renewLicense(id, body.days, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post(':id/reset-devices')
  async resetDevices(@Param('id') id: string, @Req() req: any) {
    return this.licenseService.resetDevices(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post(':id/reactivate')
  async reactivateLicense(@Param('id') id: string, @Req() req: any) {
    return this.licenseService.reactivateLicense(id, req.user.id);
  }
}
