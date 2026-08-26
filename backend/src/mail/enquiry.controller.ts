import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { MailService } from './mail.service.js';

export interface SubmitEnquiryDto {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  phone?: string;
  message?: string;
}

@Controller('v1/enquiry')
export class EnquiryController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submitEnquiry(@Body() body: SubmitEnquiryDto, @Ip() ipAddress: string) {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const company = String(body.company || '').trim();
    const teamSize = String(body.teamSize || '').trim();
    const phone = String(body.phone || '').trim();
    const message = String(body.message || '').trim();

    if (!name || name.length < 2) {
      throw new BadRequestException('Full Name is required (at least 2 characters)');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid Work Email address is required');
    }
    if (!company || company.length < 2) {
      throw new BadRequestException('Company / Organization name is required');
    }
    if (!teamSize) {
      throw new BadRequestException('Team size selection is required');
    }

    // Trigger emails asynchronously without blocking the user response
    void this.mailService.sendEnquiryLead({
      name,
      email,
      company,
      teamSize,
      phone: phone || undefined,
      message: message || undefined,
      ip: ipAddress,
    });

    return {
      success: true,
      message: 'Your enterprise demo request has been received. Our team will contact you within 24 hours.',
    };
  }
}
