// File Name: tenants.controller.ts
// Path: backend/src/modules/tenants/tenants.controller.ts

import { Controller, Get, Post, Body, UseGuards, Patch, Request, Param, ForbiddenException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { hasPlatformAccess } from '../../common/utils/platform-access';
import { UsersService } from '../users/users.service';
import { isPlatformLoginCode, resolvePlatformLoginCode } from '../../common/utils/platform-access';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_USER)
  getAll(@Request() req): Promise<Tenant[]> {
    if (!hasPlatformAccess(req.user)) {
      throw new ForbiddenException('Only the platform hotel or super user can list all hotels');
    }
    return this.tenantsService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_USER)
  create(@Body() dto: CreateTenantDto, @Request() req): Promise<Tenant> {
    return this.tenantsService.create(dto, req.user.role, req.user.isPlatformTenant);
  }

  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  getCurrent(@Request() req): Promise<Tenant> {
    return this.tenantsService.findById(req.user.tenantId);
  }

  @Patch('current')
  @Roles(UserRole.ADMIN, UserRole.SUPER_USER)
  updateCurrent(@Body() dto: UpdateTenantDto, @Request() req): Promise<Tenant> {
    return this.tenantsService.update(req.user.tenantId, dto, req.user.role);
  }
}

@Controller('public/tenants')
export class PublicTenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':code/branding')
  async getBranding(@Param('code') code: string) {
    if (isPlatformLoginCode(code)) {
      const superUser = await this.usersService.findActiveSuperUser();

      if (!superUser?.tenant) {
        return {
          code: resolvePlatformLoginCode(),
          name: 'Platform Administration',
          softwareName: 'Hospitality',
          contactEmail: null,
          contactPhone: null,
          city: 'Multi-property',
          country: null,
          timezone: 'Asia/Kolkata',
          currencyCode: 'INR',
        };
      }

      return {
        code: resolvePlatformLoginCode(),
        name: 'Platform Administration',
        softwareName: superUser.tenant.softwareName,
        contactEmail: superUser.email,
        contactPhone: superUser.phone,
        city: superUser.tenant.city,
        country: superUser.tenant.country,
        timezone: superUser.tenant.timezone,
        currencyCode: superUser.tenant.currencyCode,
      };
    }

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
