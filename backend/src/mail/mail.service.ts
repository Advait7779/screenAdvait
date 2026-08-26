import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  licenseReactivatedEmailTemplate,
  licenseExpiryWarningEmailTemplate,
  enquirySalesNotificationTemplate,
  enquiryCustomerConfirmationTemplate,
} from './templates.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly notifyEmail: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const port = parseInt(config.get<string>('SMTP_PORT') || '587', 10);
    const secureSetting = config.get<string | boolean>('SMTP_SECURE');
    const secure = secureSetting === 'true' || secureSetting === true || port === 465;

    const maxConnections = parseInt(config.get<string>('SMTP_MAX_CONNECTIONS') || '3', 10);
    const maxMessages = parseInt(config.get<string>('SMTP_MAX_MESSAGES_PER_CONNECTION') || '100', 10);

    const fromConfig = config.get<string>('SMTP_FROM');
    this.fromAddress = fromConfig
      ? fromConfig.includes('<') ? fromConfig : `"ScreenAdvait Enterprise" <${fromConfig}>`
      : `"ScreenAdvait Enterprise" <${user}>`;

    this.notifyEmail = config.get<string>('NOTIFY_EMAIL') || 'sales@advaitteleservices.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        pool: maxConnections > 1,
        maxConnections,
        maxMessages,
      } as any);
      this.enabled = true;
      this.logger.log(`Mail service enabled — SMTP: ${host}:${port} (secure: ${secure}) as ${user} | Notify: ${this.notifyEmail}`);
    } else {
      this.enabled = false;
      this.logger.warn(
        'Mail service disabled — SMTP_HOST, SMTP_USER, or SMTP_PASS not set in .env. Emails will not be sent.',
      );
    }
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(`[Mail disabled] Would have sent "${subject}" to ${to}`);
      return false;
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} — subject: "${subject}" — messageId: ${info.messageId}`);
      return true;
    } catch (err: any) {
      // Never crash the app on email failure — just log it
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return false;
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

  async sendEnquiryLead(opts: {
    name: string;
    email: string;
    company: string;
    teamSize: string;
    phone?: string;
    message?: string;
    ip?: string;
  }): Promise<{ salesNotified: boolean; confirmationSent: boolean }> {
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

    // 1. Send sales lead alert to sales team
    const salesNotification = enquirySalesNotificationTemplate({
      ...opts,
      submittedAt,
    });
    const salesNotified = await this.send(this.notifyEmail, salesNotification.subject, salesNotification.html);

    // 2. Send confirmation to prospective customer
    const confirmation = enquiryCustomerConfirmationTemplate({
      name: opts.name,
      company: opts.company,
      teamSize: opts.teamSize,
    });
    const confirmationSent = await this.send(opts.email, confirmation.subject, confirmation.html);

    return { salesNotified, confirmationSent };
  }
}
