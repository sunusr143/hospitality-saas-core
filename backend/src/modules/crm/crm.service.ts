// File Name: crm.service.ts
// Path: src/modules/crm/crm.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';
import { CreateLoyaltyAccountDto } from './dto/create-loyalty-account.dto';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyRepository: Repository<LoyaltyAccount>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async createAccount(tenantId: string, dto: CreateLoyaltyAccountDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const guest = await this.guestRepository.findOne({
      where: { id: dto.guestId, tenant: { id: tenantId } },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    const existing = await this.loyaltyRepository.findOne({
      where: { tenant: { id: tenantId }, guest: { id: guest.id } },
    });
    if (existing) return existing;

    const account = this.loyaltyRepository.create({
      tenant,
      guest,
      points: 0,
      tier: 'BASIC',
    });

    return this.loyaltyRepository.save(account);
  }

  async listAccounts(tenantId: string) {
    return this.loyaltyRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['guest'],
      order: { createdAt: 'DESC' },
    });
  }
}
