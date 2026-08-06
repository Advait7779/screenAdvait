import { Controller, Post, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import {
  LoginInput,
  LoginSchema,
  PortalLoginInput,
  PortalLoginSchema,
  RefreshTokenInput,
  RefreshTokenSchema,
  ChangePasswordInput,
  ChangePasswordSchema,
} from '@screenadvait/shared-utils';
import { Request } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Desktop Application';

    return this.authService.login(body, ipAddress, userAgent);
  }

  @Post('portal-login')
  @HttpCode(HttpStatus.OK)
  async portalLogin(
    @Body(new ZodValidationPipe(PortalLoginSchema)) body: PortalLoginInput,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web Portal';

    return this.authService.portalLogin(body, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenInput,
  ) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: ChangePasswordInput,
    @Req() req: any,
  ) {
    await this.authService.changePassword(req.user.id, body);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.id);
  }
}
