/*
File Name: corporate.service.ts
Path: src/modules/corporate/corporate.service.ts
*/

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CorporateAccount } from './entities/corporate-account.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateCorporateAccountDto } from './dto/create-corporate-account.dto';
import { UpdateCorporateAccountDto } from './dto/update-corporate-account.dto';

@Injectable()
export class CorporateService {
  constructor(
    @InjectRepository(CorporateAccount)
    private readonly accountRepository: Repository<CorporateAccount>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async createAccount(tenantId: string, dto: CreateCorporateAccountDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const existing = await this.accountRepository.findOne({
      where: { tenant: { id: tenantId }, name: dto.name },
    });
    if (existing) throw new ConflictException('Corporate account already exists');

    const account = this.accountRepository.create({
      tenant,
      name: dto.name,
      contactName: dto.contactName ?? null,
      contactEmail: dto.contactEmail ?? null,
      contactPhone: dto.contactPhone ?? null,
      billingAddress: dto.billingAddress ?? null,
      isActive: dto.isActive ?? true,
    });

    return this.accountRepository.save(account);
  }

  async updateAccount(tenantId: string, id: string, dto: UpdateCorporateAccountDto) {
    const account = await this.accountRepository.findOne({
      where: { id, tenant: { id: tenantId } },
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    if (dto.name && dto.name !== account.name) {
      const existing = await this.accountRepository.findOne({
        where: { tenant: { id: tenantId }, name: dto.name },
      });
      if (existing) throw new ConflictException('Corporate account already exists');
      account.name = dto.name;
    }

    if (dto.contactName !== undefined) account.contactName = dto.contactName ?? null;
    if (dto.contactEmail !== undefined) account.contactEmail = dto.contactEmail ?? null;
    if (dto.contactPhone !== undefined) account.contactPhone = dto.contactPhone ?? null;
    if (dto.billingAddress !== undefined) account.billingAddress = dto.billingAddress ?? null;
    if (dto.isActive !== undefined) account.isActive = dto.isActive;

    return this.accountRepository.save(account);
  }

  async listAccounts(tenantId: string) {
    return this.accountRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }
}
