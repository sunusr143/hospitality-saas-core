/*
File Name: billing-settings.service.ts
Path: src/modules/billing/services/billing-settings.service.ts
*/

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingSettings } from '../entities/billing-settings.entity';
import { Tenant } from '../../tenants/tenant.entity';

@Injectable()
export class BillingSettingsService {
  constructor(
    @InjectRepository(BillingSettings)
    private readonly settingsRepository: Repository<BillingSettings>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async getGstRate(tenantId: string): Promise<number> {
    const settings = await this.settingsRepository.findOne({
      where: { tenant: { id: tenantId } },
    });

    return settings ? Number(settings.gstRate) : 0;
  }

  async getSettings(tenantId: string) {
    const settings = await this.settingsRepository.findOne({
      where: { tenant: { id: tenantId } },
    });

    if (!settings) {
      return { gstRate: 0 };
    }

    return { gstRate: Number(settings.gstRate) };
  }

  async upsertGstRate(tenantId: string, gstRate: number) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existing = await this.settingsRepository.findOne({
      where: { tenant: { id: tenantId } },
      relations: ['tenant'],
    });

    if (existing) {
      existing.gstRate = gstRate;
      return this.settingsRepository.save(existing);
    }

    const settings = this.settingsRepository.create({
      tenant,
      gstRate,
    });

    return this.settingsRepository.save(settings);
  }
}
