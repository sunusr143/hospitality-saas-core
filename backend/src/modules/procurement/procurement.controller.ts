// File Name: procurement.controller.ts
// Path: src/modules/procurement/procurement.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { ProcurementService } from './procurement.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateStockItemDto } from './dto/create-stock-item.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('procurement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createSupplier(@Body() dto: CreateSupplierDto, @Request() req) {
    return this.procurementService.createSupplier(req.user.tenantId, dto);
  }

  @Get('suppliers')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listSuppliers(@Request() req) {
    return this.procurementService.listSuppliers(req.user.tenantId);
  }

  @Post('stock')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createStock(@Body() dto: CreateStockItemDto, @Request() req) {
    return this.procurementService.createStockItem(req.user.tenantId, dto);
  }

  @Get('stock')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listStock(@Request() req) {
    return this.procurementService.listStockItems(req.user.tenantId);
  }
}
