// File Name: spa.controller.ts
// Path: src/modules/spa/spa.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { SpaServiceManager } from './spa.service';
import { CreateSpaServiceDto } from './dto/create-spa-service.dto';
import { CreateSpaAppointmentDto } from './dto/create-spa-appointment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';

@Controller('spa')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('operations')
@AllowDepartments('Spa & Wellness', 'Administration')
export class SpaController {
  constructor(private readonly spaService: SpaServiceManager) {}

  @Post('services')
  @Roles(UserRole.ADMIN)
  async createService(@Body() dto: CreateSpaServiceDto, @Request() req) {
    return this.spaService.createService(req.user.tenantId, dto);
  }

  @Get('services')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listServices(@Request() req) {
    return this.spaService.listServices(req.user.tenantId);
  }

  @Post('appointments')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createAppointment(@Body() dto: CreateSpaAppointmentDto, @Request() req) {
    return this.spaService.bookAppointment(req.user.tenantId, dto);
  }

  @Get('appointments')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listAppointments(@Request() req) {
    return this.spaService.listAppointments(req.user.tenantId);
  }
}
