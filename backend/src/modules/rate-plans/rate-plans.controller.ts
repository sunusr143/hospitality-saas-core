// File Name: rate-plans.controller.ts
// Path: src/modules/rate-plans/rate-plans.controller.ts

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
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

  private resolveTenantCode(req: any, requestedTenantCode?: string): string {
    const tokenTenantCode = req.user?.tenantCode;

    if (!tokenTenantCode) {
      throw new BadRequestException('tenantCode missing in authenticated user');
    }

    if (requestedTenantCode && requestedTenantCode !== tokenTenantCode) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    return tokenTenantCode;
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Request() req,
    @Body() dto: CreateRatePlanDto,
  ) {
    return this.ratePlansService.create(
      this.resolveTenantCode(req),
      dto,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Request() req) {
    return this.ratePlansService.findAll(
      this.resolveTenantCode(req),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.ratePlansService.findOne(
      id,
      this.resolveTenantCode(req),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateRatePlanDto,
  ) {
    return this.ratePlansService.update(
      id,
      this.resolveTenantCode(req),
      dto,
    );
  }
}
