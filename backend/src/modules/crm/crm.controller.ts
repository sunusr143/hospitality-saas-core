// File Name: crm.controller.ts
// Path: src/modules/crm/crm.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { CrmService } from './crm.service';
import { CreateLoyaltyAccountDto } from './dto/create-loyalty-account.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('loyalty')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateLoyaltyAccountDto, @Request() req) {
    return this.crmService.createAccount(req.user.tenantId, dto);
  }

  @Get('loyalty')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.crmService.listAccounts(req.user.tenantId);
  }
}
