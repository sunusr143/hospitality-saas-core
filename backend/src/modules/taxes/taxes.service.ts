// File Name: taxes.service.ts
// Path: src/modules/taxes/taxes.service.ts

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaxRule } from './entities/tax-rule.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';

@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(TaxRule)
    private readonly taxRuleRepository: Repository<TaxRule>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async createRule(tenantId: string, dto: CreateTaxRuleDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const existing = await this.taxRuleRepository.findOne({
      where: { tenant: { id: tenantId }, name: dto.name },
    });
    if (existing) throw new ConflictException('Tax rule already exists');

    const rule = this.taxRuleRepository.create({
      tenant,
      name: dto.name,
      rate: dto.rate,
      appliesTo: dto.appliesTo ?? null,
      isActive: dto.isActive ?? true,
    });

    return this.taxRuleRepository.save(rule);
  }

  async updateRule(tenantId: string, id: string, dto: UpdateTaxRuleDto) {
    const rule = await this.taxRuleRepository.findOne({
      where: { id, tenant: { id: tenantId } },
    });
    if (!rule) throw new NotFoundException('Tax rule not found');

    if (dto.name && dto.name !== rule.name) {
      const existing = await this.taxRuleRepository.findOne({
        where: { tenant: { id: tenantId }, name: dto.name },
      });
      if (existing) throw new ConflictException('Tax rule already exists');
      rule.name = dto.name;
    }

    if (dto.rate !== undefined) rule.rate = dto.rate;
    if (dto.appliesTo !== undefined) rule.appliesTo = dto.appliesTo ?? null;
    if (dto.isActive !== undefined) rule.isActive = dto.isActive;

    return this.taxRuleRepository.save(rule);
  }

  async listRules(tenantId: string) {
    return this.taxRuleRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }
}
