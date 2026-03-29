/*
File Name: maintenance.controller.ts
Path: src/modules/maintenance/maintenance.controller.ts
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
  UseGuards,
} from '@nestjs/common';

import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { AssignMaintenanceDto } from './dto/assign-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';
import { RequireAction } from '../../common/decorators/action-access.decorator';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('maintenance')
@AllowDepartments('Maintenance', 'Administration')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateMaintenanceRequestDto, @Request() req) {
    return this.maintenanceService.createRequest({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @RequireAction('maintenance.assign')
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMaintenanceDto,
    @Request() req,
  ) {
    return this.maintenanceService.assignRequest(req.user.tenantId, id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @Request() req,
  ) {
    return this.maintenanceService.updateStatus(req.user.tenantId, id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.maintenanceService.listRequests(req.user.tenantId);
  }
}
