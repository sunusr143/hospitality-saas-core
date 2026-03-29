/*
File Name: accounting.service.ts
Path: src/modules/accounting/accounting.service.ts
*/

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaxRate } from './entities/tax-rate.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { LedgerEntryType } from './enums/ledger-entry-type.enum';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(TaxRate)
    private readonly taxRateRepository: Repository<TaxRate>,

    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,
  ) {}

  async createTaxRate(tenantId: string, dto: CreateTaxRateDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const existing = await this.taxRateRepository.findOne({
      where: { tenant: { id: tenantId }, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Tax rate with this name already exists');
    }

    const rate = this.taxRateRepository.create({
      tenant,
      name: dto.name,
      rate: dto.rate,
      isActive: dto.isActive ?? true,
    });

    return this.taxRateRepository.save(rate);
  }

  async updateTaxRate(tenantId: string, id: string, dto: UpdateTaxRateDto) {
    const rate = await this.taxRateRepository.findOne({
      where: { id, tenant: { id: tenantId } },
    });

    if (!rate) {
      throw new NotFoundException('Tax rate not found');
    }

    if (dto.name && dto.name !== rate.name) {
      const existing = await this.taxRateRepository.findOne({
        where: { tenant: { id: tenantId }, name: dto.name },
      });

      if (existing) {
        throw new ConflictException('Tax rate with this name already exists');
      }

      rate.name = dto.name;
    }

    if (dto.rate !== undefined) {
      rate.rate = dto.rate;
    }

    if (dto.isActive !== undefined) {
      rate.isActive = dto.isActive;
    }

    return this.taxRateRepository.save(rate);
  }

  async listTaxRates(tenantId: string) {
    return this.taxRateRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }

  async createLedgerEntry(params: { tenantId: string; dto: CreateLedgerEntryDto; user: { userId: string } }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const creator = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    let folio: Folio | null = null;
    if (dto.folioId) {
      folio = await this.folioRepository.findOne({ where: { id: dto.folioId, tenant: { id: tenantId } } });
      if (!folio) {
        throw new NotFoundException('Folio not found');
      }
    }

    const entry = this.ledgerRepository.create({
      tenant,
      folio,
      createdBy: creator,
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency,
      reference: dto.reference ?? null,
    });

    return this.ledgerRepository.save(entry);
  }

  async listLedgerEntries(tenantId: string, folioId?: string) {
    const where: any = { tenant: { id: tenantId } };
    if (folioId) {
      where.folio = { id: folioId };
    }

    return this.ledgerRepository.find({
      where,
      relations: ['folio', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async recordSystemEntry(params: {
    tenantId: string;
    folioId?: string | null;
    userId?: string | null;
    type: LedgerEntryType;
    amount: number;
    currency: string;
    reference?: string | null;
  }) {
    const { tenantId, folioId, userId, type, amount, currency, reference } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    let creator: User | null = null;
    if (userId) {
      creator = await this.userRepository.findOne({ where: { id: userId } });
    }

    let folio: Folio | null = null;
    if (folioId) {
      folio = await this.folioRepository.findOne({ where: { id: folioId, tenant: { id: tenantId } } });
      if (!folio) {
        throw new NotFoundException('Folio not found');
      }
    }

    const entry = this.ledgerRepository.create({
      tenant,
      folio,
      createdBy: creator,
      type,
      amount,
      currency,
      reference: reference ?? null,
    });

    return this.ledgerRepository.save(entry);
  }
}
