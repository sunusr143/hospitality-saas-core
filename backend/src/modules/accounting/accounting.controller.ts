/*
File Name: accounting.controller.ts
Path: src/modules/accounting/accounting.controller.ts
*/

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AccountingService } from './accounting.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('tax-rates')
  @Roles(UserRole.ADMIN)
  async createTaxRate(@Body() dto: CreateTaxRateDto, @Request() req) {
    return this.accountingService.createTaxRate(req.user.tenantId, dto);
  }

  @Patch('tax-rates/:id')
  @Roles(UserRole.ADMIN)
  async updateTaxRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxRateDto,
    @Request() req,
  ) {
    return this.accountingService.updateTaxRate(req.user.tenantId, id, dto);
  }

  @Get('tax-rates')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listTaxRates(@Request() req) {
    return this.accountingService.listTaxRates(req.user.tenantId);
  }

  @Post('ledger')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createLedgerEntry(@Body() dto: CreateLedgerEntryDto, @Request() req) {
    return this.accountingService.createLedgerEntry({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Get('ledger')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listLedger(@Query('folioId') folioId: string | undefined, @Request() req) {
    return this.accountingService.listLedgerEntries(req.user.tenantId, folioId);
  }
}
