/*
File Name: corporate.controller.ts
Path: src/modules/corporate/corporate.controller.ts
*/

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CorporateService } from './corporate.service';
import { CreateCorporateAccountDto } from './dto/create-corporate-account.dto';
import { UpdateCorporateAccountDto } from './dto/update-corporate-account.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('corporate')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CorporateController {
  constructor(private readonly corporateService: CorporateService) {}

  @Post('accounts')
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCorporateAccountDto, @Request() req) {
    return this.corporateService.createAccount(req.user.tenantId, dto);
  }

  @Patch('accounts/:id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCorporateAccountDto,
    @Request() req,
  ) {
    return this.corporateService.updateAccount(req.user.tenantId, id, dto);
  }

  @Get('accounts')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.corporateService.listAccounts(req.user.tenantId);
  }
}
