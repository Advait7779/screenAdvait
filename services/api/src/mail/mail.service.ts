import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  licenseReactivatedEmailTemplate,
  licenseExpiryWarningEmailTemplate,
} from './templates.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const port = parseInt(config.get<string>('SMTP_PORT') || '587', 10);
    this.fromAddress = config.get<string>('SMTP_FROM') || `"ScreenAdvait Platform" <${user}>`;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.enabled = true;
      this.logger.log(`Mail service enabled — SMTP: ${host}:${port} as ${user}`);
    } else {
      this.enabled = false;
      this.logger.warn(
        'Mail service disabled — SMTP_HOST, SMTP_USER, or SMTP_PASS not set in .env. Emails will not be sent.',
      );
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(`[Mail disabled] Would have sent "${subject}" to ${to}`);
      return;
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} — subject: "${subject}" — messageId: ${info.messageId}`);
    } catch (err: any) {
      // Never crash the app on email failure — just log it
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }

  async sendWelcomeEmail(opts: {
    to: string;
    fullName: string;
    username: string;
    password: string;
    licenseKey: string;
    companyName: string;
    serverUrl?: string;
  }): Promise<void> {
    const { subject, html } = welcomeEmailTemplate(opts);
    await this.send(opts.to, subject, html);
  }

  async sendPasswordResetEmail(opts: {
    to: string;
    fullName: string;
    username: string;
    newPassword: string;
    companyName: string;
  }): Promise<void> {
    const { subject, html } = passwordResetEmailTemplate(opts);
    await this.send(opts.to, subject, html);
  }

  async sendLicenseReactivatedEmail(opts: {
    to: string;
    fullName: string;
    username: string;
    licenseKey: string;
    companyName: string;
  }): Promise<void> {
    const { subject, html } = licenseReactivatedEmailTemplate(opts);
    await this.send(opts.to, subject, html);
  }

  async sendLicenseExpiryWarning(opts: {
    to: string;
    adminFullName: string;
    companyName: string;
    employeeName: string;
    licenseKey: string;
    expiryDate: string;
    daysLeft: number;
  }): Promise<void> {
    const { subject, html } = licenseExpiryWarningEmailTemplate(opts);
    await this.send(opts.to, subject, html);
  }
}
