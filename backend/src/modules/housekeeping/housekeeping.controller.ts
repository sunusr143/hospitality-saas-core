// File Name: housekeeping.controller.ts
// Path: src/modules/housekeeping/housekeeping.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingStatusDto } from './dto/update-housekeeping-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('housekeeping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Query('tenantCode') tenantCode: string,
    @Body() dto: CreateHousekeepingTaskDto,
  ) {
    return this.housekeepingService.create(tenantCode, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Query('tenantCode') tenantCode: string) {
    return this.housekeepingService.findAll(tenantCode);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateHousekeepingStatusDto,
  ) {
    return this.housekeepingService.updateStatus(id, dto);
  }
}
