// File Name: housekeeping.controller.ts
// Path: src/modules/housekeeping/housekeeping.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingStatusDto } from './dto/update-housekeeping-status.dto';
import { AssignHousekeepingDto } from './dto/assign-housekeeping.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';
import { RequireAction } from '../../common/decorators/action-access.decorator';

@Controller('housekeeping')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('housekeeping')
@AllowDepartments('Housekeeping', 'Administration')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateHousekeepingTaskDto, @Request() req) {
    return this.housekeepingService.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Request() req) {
    return this.housekeepingService.findAll(req.user.tenantId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateHousekeepingStatusDto,
    @Request() req,
  ) {
    return this.housekeepingService.updateStatus(req.user.tenantId, id, dto);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @RequireAction('housekeeping.assign')
  assignTask(
    @Param('id') id: string,
    @Body() dto: AssignHousekeepingDto,
    @Request() req,
  ) {
    return this.housekeepingService.assignTask(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post('inspections')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @RequireAction('housekeeping.inspect')
  createInspection(@Body() dto: CreateInspectionDto, @Request() req) {
    return this.housekeepingService.createInspection(
      req.user.tenantId,
      dto,
      req.user.userId,
    );
  }

  @Get('inspections')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  listInspections(@Request() req) {
    return this.housekeepingService.listInspections(req.user.tenantId);
  }
}
