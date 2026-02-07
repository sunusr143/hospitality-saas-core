// File Name: taxes.controller.ts
// Path: src/modules/taxes/taxes.controller.ts

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';

import { TaxesService } from './taxes.service';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('taxes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post('rules')
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateTaxRuleDto, @Request() req) {
    return this.taxesService.createRule(req.user.tenantId, dto);
  }

  @Patch('rules/:id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxRuleDto,
    @Request() req,
  ) {
    return this.taxesService.updateRule(req.user.tenantId, id, dto);
  }

  @Get('rules')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.taxesService.listRules(req.user.tenantId);
  }
}
