import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  CreateOrderDto,
  PaymentService,
  VerifyPaymentDto,
} from './payment.service.js';

@Controller('v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('config')
  getConfig() {
    return this.paymentService.getConfig();
  }

  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  async createOrder(@Body() body: CreateOrderDto) {
    return this.paymentService.createOrder(body);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() body: VerifyPaymentDto) {
    return this.paymentService.verifyAndProvision(body);
  }
}
