// File Name: laundry.controller.ts
// Path: src/modules/laundry/laundry.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { LaundryService } from './laundry.service';
import { CreateLaundryOrderDto } from './dto/create-laundry-order.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('laundry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaundryController {
  constructor(private readonly laundryService: LaundryService) {}

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateLaundryOrderDto, @Request() req) {
    return this.laundryService.createOrder(req.user.tenantId, dto);
  }

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.laundryService.listOrders(req.user.tenantId);
  }
}
