import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service.js';
import { EnquiryController } from './enquiry.controller.js';

@Global()
@Module({
  controllers: [EnquiryController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
