// File Name: tenants.service.ts
// Path: backend/src/modules/tenants/tenants.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

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

  create(data: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      ...data,
      enabledModules:
        data.enabledModules && data.enabledModules.length
          ? Array.from(new Set(data.enabledModules))
          : [...Tenant.DEFAULT_ENABLED_MODULES],
    });
    return this.tenantRepository.save(tenant);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findById(id);

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
