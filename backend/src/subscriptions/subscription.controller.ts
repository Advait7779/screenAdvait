import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import {
  RenewLicenseInput,
  RenewLicenseSchema,
  SubscriptionStatusInput,
  SubscriptionStatusSchema,
  UpsertCompanySubscriptionInput,
  UpsertCompanySubscriptionSchema,
} from '@screenadvait/shared-utils';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { SubscriptionService } from './subscription.service.js';

@Controller('v1/subscriptions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Get()
  getAll() {
    return this.subscriptions.getAll();
  }

  @Post()
  upsert(
    @Body(new ZodValidationPipe(UpsertCompanySubscriptionSchema))
    body: UpsertCompanySubscriptionInput,
    @Req() req: any,
  ) {
    return this.subscriptions.upsert(body, req.user.id);
  }

  @Post(':id/renew')
  renew(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RenewLicenseSchema)) body: RenewLicenseInput,
    @Req() req: any,
  ) {
    return this.subscriptions.renew(id, body.days, req.user.id);
  }

  @Post(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SubscriptionStatusSchema)) body: SubscriptionStatusInput,
    @Req() req: any,
  ) {
    return this.subscriptions.setStatus(id, body, req.user.id);
  }
}
