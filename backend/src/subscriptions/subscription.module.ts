import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard.js';
import { SubscriptionController } from './subscription.controller.js';
import { SubscriptionService } from './subscription.service.js';

@Module({
  providers: [SubscriptionService, RolesGuard],
  controllers: [SubscriptionController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
