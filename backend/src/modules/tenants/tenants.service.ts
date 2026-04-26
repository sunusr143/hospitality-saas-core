// File Name: tenants.service.ts
// Path: backend/src/modules/tenants/tenants.service.ts

import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findByCode(code: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { code } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  create(data: Partial<Tenant>, actorRole?: UserRole, isPlatformTenant = false): Promise<Tenant> {
    if (actorRole !== UserRole.SUPER_USER && !isPlatformTenant) {
      throw new ForbiddenException('Only a super user or platform hotel admin can create a tenant');
    }

    const tenant = this.tenantRepository.create({
      ...data,
      enabledModules:
        data.enabledModules && data.enabledModules.length
          ? Array.from(new Set(data.enabledModules))
          : [...Tenant.DEFAULT_ENABLED_MODULES],
    });
    return this.tenantRepository.save(tenant);
  }

  async update(id: string, data: Partial<Tenant>, actorRole?: UserRole): Promise<Tenant> {
    const tenant = await this.findById(id);
    const hasPlatformChanges =
      data.code !== undefined || data.softwareName !== undefined || data.enabledModules !== undefined;

    if (hasPlatformChanges && actorRole !== UserRole.SUPER_USER) {
      throw new ForbiddenException('Only a super user can update hotel code, software branding, or enabled modules');
    }

    if (data.code !== undefined) {
      const normalizedCode = data.code.trim().toUpperCase();
      const existingTenant = await this.tenantRepository.findOne({ where: { code: normalizedCode } });

      if (existingTenant && existingTenant.id !== tenant.id) {
        throw new ConflictException('Hotel code already exists');
      }

      tenant.code = normalizedCode;
    }

    if (data.name !== undefined) {
      tenant.name = data.name;
    }

    if (data.softwareName !== undefined) {
      tenant.softwareName = data.softwareName;
    }

    if (data.contactEmail !== undefined) {
      tenant.contactEmail = data.contactEmail;
    }

    if (data.contactPhone !== undefined) {
      tenant.contactPhone = data.contactPhone;
    }

    if (data.addressLine1 !== undefined) {
      tenant.addressLine1 = data.addressLine1;
    }

    if (data.city !== undefined) {
      tenant.city = data.city;
    }

    if (data.country !== undefined) {
      tenant.country = data.country;
    }

    if (data.currencyCode !== undefined) {
      tenant.currencyCode = data.currencyCode;
    }

    if (data.timezone !== undefined) {
      tenant.timezone = data.timezone;
    }

    if (data.checkInTime !== undefined) {
      tenant.checkInTime = data.checkInTime;
    }

    if (data.checkOutTime !== undefined) {
      tenant.checkOutTime = data.checkOutTime;
    }

    if (data.enabledModules !== undefined) {
      tenant.enabledModules = data.enabledModules.length
        ? Array.from(new Set(data.enabledModules))
        : [...Tenant.DEFAULT_ENABLED_MODULES];
    }

    return this.tenantRepository.save(tenant);
  }
}
