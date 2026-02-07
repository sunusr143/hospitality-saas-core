/*
File Name: inventory.controller.ts
Path: src/modules/inventory/inventory.controller.ts
*/

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';

import { InventoryService } from './inventory.service';
import { CreateOutOfOrderDto } from './dto/create-out-of-order.dto';
import { ResolveOutOfOrderDto } from './dto/resolve-out-of-order.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('out-of-order')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async markOutOfOrder(@Body() dto: CreateOutOfOrderDto, @Request() req) {
    return this.inventoryService.markOutOfOrder({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Patch('out-of-order/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async resolveOutOfOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveOutOfOrderDto,
    @Request() req,
  ) {
    return this.inventoryService.resolveOutOfOrder({
      tenantId: req.user.tenantId,
      id,
      dto,
    });
  }

  @Get('out-of-order')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listOutOfOrder(@Request() req) {
    return this.inventoryService.listOutOfOrder(req.user.tenantId);
  }
}
