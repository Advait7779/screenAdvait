import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { GoogleDriveService } from './screenshots/google-drive.service.js';

@Controller('v1/health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: GoogleDriveService,
  ) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const storage = await this.storage.checkHealth();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        dependencies: { database: 'ready', storage },
      };
    } catch {
      throw new ServiceUnavailableException('A required service is unavailable');
    }
  }
}
