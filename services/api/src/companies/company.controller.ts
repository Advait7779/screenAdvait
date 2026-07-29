import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { AuthGuard } from '@nestjs/passport';
import { CreateCompanyInput, CreateCompanySchema } from '@screenadvait/shared-utils';
import { Role } from '@prisma/client';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('v1/companies')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Post()
  async createCompany(
    @Body(new ZodValidationPipe(CreateCompanySchema)) body: CreateCompanyInput,
  ) {
    return this.companyService.createCompany(body);
  }
}
