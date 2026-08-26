import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LicensePlan, Role, SubscriptionStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

export interface CreateOrderDto {
  plan: 'MONTHLY' | 'ANNUAL';
  seats: number;
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: 'MONTHLY' | 'ANNUAL';
  seats: number;
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    this.keyId = this.config.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET') || '';

    if (this.keyId && this.keySecret) {
      this.logger.log(`Razorpay payments enabled with Key ID: ${this.keyId.slice(0, 8)}...`);
    } else {
      this.logger.warn('Razorpay payments not fully configured — RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in .env');
    }
  }

  getConfig() {
    return {
      keyId: this.keyId,
      isLive: Boolean(this.keyId && this.keySecret),
      currency: 'INR',
    };
  }

  calculateAmount(plan: 'MONTHLY' | 'ANNUAL', seats: number): number {
    const safeSeats = Math.max(1, Math.floor(seats));
    if (plan === 'ANNUAL') {
      // ₹200 / employee / month billed annually (12 months)
      return safeSeats * 200 * 12;
    }
    // ₹300 / employee / month billed monthly
    return safeSeats * 300;
  }

  async createOrder(input: CreateOrderDto) {
    if (!this.keyId || !this.keySecret) {
      throw new BadRequestException(
        'Online payments are temporarily unavailable. Please contact sales@advaitteleservices.com to get started.',
      );
    }

    const seats = Math.max(1, Math.floor(Number(input.seats) || 10));
    const totalInRupees = this.calculateAmount(input.plan, seats);
    const amountInPaise = totalInRupees * 100;

    const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const credentials = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            plan: input.plan,
            seats: String(seats),
            companyName: input.companyName,
            adminEmail: input.adminEmail,
            adminName: input.adminName,
          },
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        this.logger.error(`Razorpay order creation failed: ${JSON.stringify(orderData)}`);
        throw new BadRequestException(orderData.error?.description || 'Razorpay order creation failed');
      }

      return {
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: this.keyId,
        plan: input.plan,
        seats,
        totalRupees: totalInRupees,
        companyName: input.companyName,
        adminEmail: input.adminEmail,
        adminName: input.adminName,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Razorpay API communication error: ${err.message}`);
      throw new InternalServerErrorException('Unable to communicate with payment gateway');
    }
  }

  async verifyAndProvision(input: VerifyPaymentDto) {
    if (!this.keySecret) {
      throw new BadRequestException('Payment configuration missing');
    }

    // 1. Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== input.razorpay_signature) {
      this.logger.error(
        `Invalid payment signature! Order: ${input.razorpay_order_id}, Payment: ${input.razorpay_payment_id}`,
      );
      throw new BadRequestException('Invalid payment signature. Payment verification failed.');
    }

    // 2. Check if company already exists
    const companyCode = this.generateCompanyCode(input.companyName);
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        OR: [
          { code: companyCode },
          { contactEmail: input.adminEmail.toLowerCase().trim() },
          { name: { equals: input.companyName.trim(), mode: 'insensitive' } },
        ],
      },
    });

    const seats = Math.max(1, Math.floor(Number(input.seats) || 10));
    const isAnnual = input.plan === 'ANNUAL';
    const planEnum = isAnnual ? LicensePlan.ONE_YEAR : LicensePlan.MONTHLY;
    const durationDays = isAnnual ? 365 : 30;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);

    let companyId: string;
    let username: string;
    let temporaryPassword = `${crypto.randomBytes(6).toString('hex')}Aa1!`;
    let isExisting = false;

    if (existingCompany) {
      // Extend or update existing company subscription
      isExisting = true;
      companyId = existingCompany.id;
      const adminUser = await this.prisma.user.findFirst({
        where: { companyId, role: Role.COMPANY_ADMIN },
      });
      username = adminUser?.username || companyCode.toLowerCase();

      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.create({
          data: {
            companyId,
            plan: planEnum,
            status: SubscriptionStatus.ACTIVE,
            startDate,
            endDate,
            maxEmployees: seats,
            maxDevices: seats,
            maxStorageMb: existingCompany.maxStorageMb,
          },
        });
        await tx.company.update({
          where: { id: companyId },
          data: {
            maxUsers: Math.max(existingCompany.maxUsers, seats),
          },
        });
      });
    } else {
      // Provision brand new Company & Company Admin
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);
      username = `${companyCode.toLowerCase()}_admin`;

      const created = await this.prisma.$transaction(async (tx) => {
        const comp = await tx.company.create({
          data: {
            name: input.companyName.trim(),
            code: companyCode,
            contactEmail: input.adminEmail.toLowerCase().trim(),
            contactPhone: input.adminPhone?.trim() || null,
            maxUsers: seats,
            maxStorageMb: BigInt(51200),
            users: {
              create: {
                email: input.adminEmail.toLowerCase().trim(),
                username,
                fullName: input.adminName.trim() || `${input.companyName.trim()} Admin`,
                passwordHash,
                role: Role.COMPANY_ADMIN,
              },
            },
            subscriptions: {
              create: {
                plan: planEnum,
                status: SubscriptionStatus.ACTIVE,
                startDate,
                endDate,
                maxEmployees: seats,
                maxDevices: seats,
                maxStorageMb: BigInt(51200),
              },
            },
          },
          include: { users: true },
        });

        await tx.auditLog.create({
          data: {
            companyId: comp.id,
            userId: comp.users[0]?.id || comp.id,
            action: 'ONLINE_PURCHASE_PROVISIONED',
            entity: 'Company',
            entityId: comp.id,
            details: {
              orderId: input.razorpay_order_id,
              paymentId: input.razorpay_payment_id,
              plan: input.plan,
              seats,
            },
          },
        });

        return comp;
      });

      companyId = created.id;
    }

    // 3. Send Emails via MailService
    if (!isExisting) {
      void this.mail.sendWelcomeEmail({
        to: input.adminEmail,
        fullName: input.adminName,
        username,
        password: temporaryPassword,
        licenseKey: `${companyCode}-PLAN-${input.plan}`,
        companyName: input.companyName,
        serverUrl: 'https://screen.advaitdigital.co.in/',
      });
    }

    // 4. Send internal alert to sales team
    const totalAmount = this.calculateAmount(input.plan, seats);
    void this.mail.sendEnquiryLead({
      name: input.adminName,
      email: input.adminEmail,
      company: input.companyName,
      teamSize: `${seats} Seats (${input.plan} Plan — ₹${totalAmount})`,
      phone: input.adminPhone,
      message: `✅ ONLINE PAYMENT COMPLETED! Payment ID: ${input.razorpay_payment_id}, Order ID: ${input.razorpay_order_id}, Total: ₹${totalAmount}`,
    });

    return {
      success: true,
      message: isExisting
        ? 'Subscription extended successfully'
        : 'Enterprise account provisioned successfully. Check your email for login credentials.',
      companyId,
      portalUrl: 'https://screen.advaitdigital.co.in/',
      username,
      temporaryPassword: isExisting ? undefined : temporaryPassword,
    };
  }

  private generateCompanyCode(name: string): string {
    const cleaned = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const suffix = Math.floor(100 + Math.random() * 900);
    return `${cleaned || 'CORP'}${suffix}`;
  }
}
