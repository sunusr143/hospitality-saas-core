/*
File Name: folios.controller.ts
Path: src/modules/billing/controllers/folios.controller.ts
*/

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';

import { FoliosService } from '../services/folios.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { UserRole } from '../../users/enums/user-role.enum';
import { AddLineItemDto } from '../dto/add-line-item.dto';

@Controller('folios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FoliosController {
  constructor(private readonly foliosService: FoliosService) {}

  /**
   * ADMIN — create folio manually (ops / recovery)
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async createFolio(
    @Body('reservationId', ParseUUIDPipe) reservationId: string,
    @Request() req,
  ) {
    return this.foliosService.createFolio({
      tenantId: req.user.tenantId,
      reservationId,
      user: req.user,
    });
  }

  /**
   * ADMIN + STAFF
   */
  @Get(':reservationId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getByReservation(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Request() req,
  ) {
    return this.foliosService.getFolioForReservation(
      req.user.tenantId,
      reservationId,
    );
  }

  /**
   * ADMIN + STAFF
   */
  @Post(':folioId/line-items')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async addLineItem(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Body() dto: AddLineItemDto,
    @Request() req,
  ) {
    return this.foliosService.addLineItem({
      tenantId: req.user.tenantId,
      folioId,
      dto,
      user: req.user,
    });
  }

  /**
   * ADMIN only
   */
  @Patch(':folioId/close')
  @Roles(UserRole.ADMIN)
  async closeFolio(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Request() req,
  ) {
    return this.foliosService.closeFolio(
      req.user.tenantId,
      folioId,
      req.user,
    );
  }
}
