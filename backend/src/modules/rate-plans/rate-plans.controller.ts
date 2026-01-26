// File Name: rate-plans.controller.ts
// Path: src/modules/rate-plans/rate-plans.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RatePlansService } from './rate-plans.service';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('rate-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RatePlansController {
  constructor(private readonly ratePlansService: RatePlansService) {}

  private requireTenantCode(tenantCode?: string): string {
    if (!tenantCode) {
      throw new BadRequestException('tenantCode query parameter is required');
    }
    return tenantCode;
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Query('tenantCode') tenantCode: string | undefined,
    @Body() dto: CreateRatePlanDto,
  ) {
    return this.ratePlansService.create(
      this.requireTenantCode(tenantCode),
      dto,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Query('tenantCode') tenantCode: string | undefined) {
    return this.ratePlansService.findAll(
      this.requireTenantCode(tenantCode),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(
    @Param('id') id: string,
    @Query('tenantCode') tenantCode: string | undefined,
  ) {
    return this.ratePlansService.findOne(
      id,
      this.requireTenantCode(tenantCode),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Query('tenantCode') tenantCode: string | undefined,
    @Body() dto: UpdateRatePlanDto,
  ) {
    return this.ratePlansService.update(
      id,
      this.requireTenantCode(tenantCode),
      dto,
    );
  }
}
