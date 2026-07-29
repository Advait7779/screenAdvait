import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { ScreenshotUploadMetadataSchema } from '@screenadvait/shared-utils';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ScreenshotService } from './screenshot.service.js';

@Controller('v1/screenshots')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ScreenshotController {
  constructor(private readonly screenshotService: ScreenshotService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 5 },
      fileFilter: (_req, file, callback) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        callback(
          allowed.includes(file.mimetype) ? null : new BadRequestException('Unsupported image type'),
          allowed.includes(file.mimetype),
        );
      },
    }),
  )
  async uploadScreenshot(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(ScreenshotUploadMetadataSchema))
    body: { deviceId: string; capturedAt: string },
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Screenshot file is required');
    return this.screenshotService.processUpload(file, {
      userId: req.user.id,
      companyId: req.user.companyId,
      deviceId: body.deviceId,
      capturedAt: body.capturedAt,
    });
  }

  @Get('mine')
  getMyScreenshots(@Req() req: any) {
    return this.screenshotService.getMyScreenshots(req.user.id);
  }

  @Get('company')
  @Roles(Role.COMPANY_ADMIN, Role.SUPER_ADMIN)
  getCompanyScreenshots(@Req() req: any) {
    return this.screenshotService.getCompanyScreenshots(req.user.companyId);
  }

  @Get(':id/file')
  async getScreenshotFile(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const file = await this.screenshotService.getFile(id, req.user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/[\r\n"\\]/g, '_')}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(file.buffer);
  }
}
