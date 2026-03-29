// File Name: tenants.controller.ts
// Path: backend/src/modules/tenants/tenants.controller.ts

import { Controller, Get, Post, Body, UseGuards, Patch, Request, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  getAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(dto);
  }

  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getCurrent(@Request() req): Promise<Tenant> {
    return this.tenantsService.findById(req.user.tenantId);
  }

  @Patch('current')
  @Roles(UserRole.ADMIN)
  updateCurrent(@Body() dto: UpdateTenantDto, @Request() req): Promise<Tenant> {
    return this.tenantsService.update(req.user.tenantId, dto);
  }
}

@Controller('public/tenants')
export class PublicTenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(':code/branding')
  async getBranding(@Param('code') code: string) {
    const tenant = await this.tenantsService.findByCode(code);
    return {
      code: tenant.code,
      name: tenant.name,
      softwareName: tenant.softwareName,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      city: tenant.city,
      country: tenant.country,
      timezone: tenant.timezone,
      currencyCode: tenant.currencyCode,
    };
  }
}
