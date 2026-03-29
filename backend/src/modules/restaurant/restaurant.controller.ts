/*
File Name: restaurant.controller.ts
Path: src/modules/restaurant/restaurant.controller.ts
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { RestaurantService } from './restaurant.service';
import { CreateRestaurantCategoryDto } from './dto/create-restaurant-category.dto';
import { UpdateRestaurantCategoryDto } from './dto/update-restaurant-category.dto';
import { CreateRestaurantItemDto } from './dto/create-restaurant-item.dto';
import { UpdateRestaurantItemDto } from './dto/update-restaurant-item.dto';
import { CreateRestaurantOrderDto } from './dto/create-restaurant-order.dto';
import { UpdateRestaurantOrderDto } from './dto/update-restaurant-order.dto';
import { PostRestaurantOrderDto } from './dto/post-restaurant-order.dto';
import { CancelRestaurantOrderDto } from './dto/cancel-restaurant-order.dto';
import { ImportRestaurantItemsDto } from './dto/import-restaurant-items.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';

@Controller('restaurant')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('restaurant')
@AllowDepartments('Food & Beverage', 'Kitchen', 'Administration')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post('categories')
  @Roles(UserRole.ADMIN)
  async createCategory(@Body() dto: CreateRestaurantCategoryDto, @Request() req) {
    return this.restaurantService.createCategory(req.user.tenantId, dto);
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN)
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantCategoryDto,
    @Request() req,
  ) {
    return this.restaurantService.updateCategory(req.user.tenantId, id, dto);
  }

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listCategories(@Request() req) {
    return this.restaurantService.listCategories(req.user.tenantId);
  }

  @Post('items')
  @Roles(UserRole.ADMIN)
  async createItem(@Body() dto: CreateRestaurantItemDto, @Request() req) {
    return this.restaurantService.createItem(req.user.tenantId, dto);
  }

  @Post('items/import')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importItems(
    @UploadedFile() file: any,
    @Body() dto: ImportRestaurantItemsDto,
    @Request() req,
  ) {
    return this.restaurantService.importItemsFromCsv({
      tenantId: req.user.tenantId,
      file,
      dto,
    });
  }

  @Patch('items/:id')
  @Roles(UserRole.ADMIN)
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantItemDto,
    @Request() req,
  ) {
    return this.restaurantService.updateItem(req.user.tenantId, id, dto);
  }

  @Get('items')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listItems(@Request() req) {
    return this.restaurantService.listItems(req.user.tenantId);
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createOrder(@Body() dto: CreateRestaurantOrderDto, @Request() req) {
    return this.restaurantService.createOrder({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listOrders(@Request() req) {
    return this.restaurantService.listOrders(req.user.tenantId);
  }

  @Get('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.restaurantService.getOrder(req.user.tenantId, id);
  }

  @Patch('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantOrderDto,
    @Request() req,
  ) {
    return this.restaurantService.updateOrder({
      tenantId: req.user.tenantId,
      orderId: id,
      dto,
    });
  }

  @Post('orders/:id/post')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async postOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostRestaurantOrderDto,
    @Request() req,
  ) {
    return this.restaurantService.postOrderToFolio({
      tenantId: req.user.tenantId,
      orderId: id,
      folioId: dto.folioId,
    });
  }

  @Post('orders/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelRestaurantOrderDto,
    @Request() req,
  ) {
    return this.restaurantService.cancelOrder({
      tenantId: req.user.tenantId,
      orderId: id,
      dto,
    });
  }
}
