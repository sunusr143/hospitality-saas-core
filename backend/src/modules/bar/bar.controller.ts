/*
File Name: bar.controller.ts
Path: src/modules/bar/bar.controller.ts
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

import { BarService } from './bar.service';
import { CreateBarCategoryDto } from './dto/create-bar-category.dto';
import { UpdateBarCategoryDto } from './dto/update-bar-category.dto';
import { CreateBarItemDto } from './dto/create-bar-item.dto';
import { UpdateBarItemDto } from './dto/update-bar-item.dto';
import { CreateBarOrderDto } from './dto/create-bar-order.dto';
import { PostBarOrderDto } from './dto/post-bar-order.dto';
import { CancelBarOrderDto } from './dto/cancel-bar-order.dto';
import { SeedBarDto } from './dto/seed-bar.dto';
import { FindBarOrdersDto } from './dto/find-bar-orders.dto';
import { FindBarItemsDto } from './dto/find-bar-items.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('bar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarController {
  constructor(private readonly barService: BarService) {}

  /**
   * ADMIN — create category
   */
  @Post('categories')
  @Roles(UserRole.ADMIN)
  async createCategory(@Body() dto: CreateBarCategoryDto, @Request() req) {
    return this.barService.createCategory(req.user.tenantId, dto);
  }

  /**
   * ADMIN — update category
   */
  @Patch('categories/:id')
  @Roles(UserRole.ADMIN)
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBarCategoryDto,
    @Request() req,
  ) {
    return this.barService.updateCategory(req.user.tenantId, id, dto);
  }

  /**
   * ADMIN + STAFF — list categories
   */
  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listCategories(@Request() req) {
    return this.barService.listCategories(req.user.tenantId);
  }

  /**
   * ADMIN — create item
   */
  @Post('items')
  @Roles(UserRole.ADMIN)
  async createItem(@Body() dto: CreateBarItemDto, @Request() req) {
    return this.barService.createItem(req.user.tenantId, dto);
  }

  /**
   * ADMIN — update item
   */
  @Patch('items/:id')
  @Roles(UserRole.ADMIN)
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBarItemDto,
    @Request() req,
  ) {
    return this.barService.updateItem(req.user.tenantId, id, dto);
  }

  /**
   * ADMIN + STAFF — list items
   */
  @Get('items')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listItems(@Query() query: FindBarItemsDto, @Request() req) {
    return this.barService.listItems(req.user.tenantId, query);
  }

  /**
   * ADMIN + STAFF — create order
   */
  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createOrder(@Body() dto: CreateBarOrderDto, @Request() req) {
    return this.barService.createOrder({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  /**
   * ADMIN + STAFF — list orders
   */
  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listOrders(@Query() query: FindBarOrdersDto, @Request() req) {
    return this.barService.listOrders(req.user.tenantId, query);
  }

  /**
   * ADMIN + STAFF — fetch order
   */
  @Get('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.barService.getOrder(req.user.tenantId, id);
  }

  /**
   * ADMIN + STAFF — post order to folio
   */
  @Post('orders/:id/post')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async postOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostBarOrderDto,
    @Request() req,
  ) {
    return this.barService.postOrderToFolio({
      tenantId: req.user.tenantId,
      orderId: id,
      folioId: dto.folioId,
    });
  }

  /**
   * ADMIN + STAFF — cancel order (optionally reverse folio charge)
   */
  @Post('orders/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBarOrderDto,
    @Request() req,
  ) {
    return this.barService.cancelOrder({
      tenantId: req.user.tenantId,
      orderId: id,
      dto,
    });
  }

  /**
   * ADMIN — seed default bar menu
   */
  @Post('seed')
  @Roles(UserRole.ADMIN)
  async seedDefaults(@Body() dto: SeedBarDto, @Request() req) {
    return this.barService.seedDefaults({
      tenantId: req.user.tenantId,
      dto,
    });
  }
}
