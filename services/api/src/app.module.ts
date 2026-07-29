import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { LicenseModule } from './licenses/license.module.js';
import { ScreenshotModule } from './screenshots/screenshot.module.js';
import { CompanyModule } from './companies/company.module.js';
import { HealthController } from './health.controller.js';
import { EntitlementModule } from './entitlements/entitlement.module.js';
import { SubscriptionModule } from './subscriptions/subscription.module.js';
import { CompanyAdminModule } from './company-admin/company-admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EntitlementModule,
    AuthModule,
    LicenseModule,
    ScreenshotModule,
    CompanyModule,
    SubscriptionModule,
    CompanyAdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
