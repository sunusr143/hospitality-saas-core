/**
 * File Name: reservations.controller.ts
 * Path: src/modules/reservations/reservations.controller.ts
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';

import { UserRole } from '../users/enums/user-role.enum';
import { ReservationStatus } from './reservation.entity';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('reservations')
@AllowDepartments('Front Office', 'Reservations', 'Administration')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  /**
   * Create reservation
   * ADMIN + STAFF
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateReservationDto, @Request() req) {
    return this.reservationsService.createReservation({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  /**
   * List reservations for tenant
   * ADMIN + STAFF
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(@Request() req) {
    return this.reservationsService.findAllForTenant(
      req.user.tenantId,
    );
  }

  /**
   * Update reservation details
   * ADMIN + STAFF
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReservationDto,
    @Request() req,
  ) {
    return this.reservationsService.updateReservation({
      tenantId: req.user.tenantId,
      reservationId: id,
      dto,
    });
  }

  /**
   * Change reservation status
   * ADMIN only
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { status: ReservationStatus },
    @Request() req,
  ) {
    return this.reservationsService.changeStatus({
      tenantId: req.user.tenantId,
      reservationId: id,
      newStatus: body.status,
      user: req.user,
    });
  }
}
