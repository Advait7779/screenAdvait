import { Global, Module } from '@nestjs/common';
import { EntitlementService } from './entitlement.service.js';

@Global()
@Module({
  providers: [EntitlementService],
  exports: [EntitlementService],
})
export class EntitlementModule {}
