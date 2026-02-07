// File Name: hr.controller.ts
// Path: src/modules/hr/hr.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { HrService } from './hr.service';
import { CreateShiftDto } from './dto/create-shift.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Post('shifts')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createShift(@Body() dto: CreateShiftDto, @Request() req) {
    return this.hrService.createShift(req.user.tenantId, dto);
  }

  @Get('shifts')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listShifts(@Request() req) {
    return this.hrService.listShifts(req.user.tenantId);
  }
}
