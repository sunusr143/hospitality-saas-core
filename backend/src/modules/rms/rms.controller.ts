/*
File Name: rms.controller.ts
Path: src/modules/rms/rms.controller.ts
*/

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { RmsService } from './rms.service';
import { SetRateDto } from './dto/set-rate.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { SetRestrictionDto } from './dto/set-restriction.dto';
import { RmsQueryDto } from './dto/rms-query.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('rms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RmsController {
  constructor(private readonly rmsService: RmsService) {}

  @Post('rates')
  @Roles(UserRole.ADMIN)
  async setRate(@Body() dto: SetRateDto, @Request() req) {
    return this.rmsService.upsertRate(req.user.tenantId, dto);
  }

  @Post('availability')
  @Roles(UserRole.ADMIN)
  async setAvailability(@Body() dto: SetAvailabilityDto, @Request() req) {
    return this.rmsService.upsertAvailability(req.user.tenantId, dto);
  }

  @Post('restrictions')
  @Roles(UserRole.ADMIN)
  async setRestriction(@Body() dto: SetRestrictionDto, @Request() req) {
    return this.rmsService.upsertRestriction(req.user.tenantId, dto);
  }

  @Get('rates')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listRates(@Query() query: RmsQueryDto, @Request() req) {
    return this.rmsService.listRates(req.user.tenantId, query);
  }

  @Get('availability')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listAvailability(@Query() query: RmsQueryDto, @Request() req) {
    return this.rmsService.listAvailability(req.user.tenantId, query);
  }

  @Get('restrictions')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listRestrictions(@Query() query: RmsQueryDto, @Request() req) {
    return this.rmsService.listRestrictions(req.user.tenantId, query);
  }
}
