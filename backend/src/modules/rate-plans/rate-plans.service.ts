// File Name: rate-plans.service.ts
// Path: src/modules/rate-plans/rate-plans.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RatePlan } from './entities/rate-plan.entity';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { Tenant } from '../tenants/tenant.entity';
import { RatePlanStatus } from './enums/rate-plan-status.enum';

@Injectable()
export class RatePlansService {
  constructor(
    @InjectRepository(RatePlan)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(tenantCode: string, dto: CreateRatePlanDto): Promise<RatePlan> {
    if (new Date(dto.validFrom) >= new Date(dto.validTo)) {
      throw new BadRequestException('validFrom must be before validTo');
    }

    const tenant = await this.tenantRepository.findOne({
      where: { code: tenantCode },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const ratePlan = this.ratePlanRepository.create({
      ...dto,
      tenant,
    });

    return this.ratePlanRepository.save(ratePlan);
  }

  async findAll(tenantCode: string): Promise<RatePlan[]> {
    return this.ratePlanRepository.find({
      where: { tenant: { code: tenantCode } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantCode: string): Promise<RatePlan> {
    const ratePlan = await this.ratePlanRepository.findOne({
      where: { id, tenant: { code: tenantCode } },
    });

    if (!ratePlan) {
      throw new NotFoundException('Rate plan not found');
    }

    return ratePlan;
  }

  async update(
    id: string,
    tenantCode: string,
    dto: UpdateRatePlanDto,
  ): Promise<RatePlan> {
    const ratePlan = await this.findOne(id, tenantCode);

    Object.assign(ratePlan, dto);

    if (
      ratePlan.validFrom &&
      ratePlan.validTo &&
      new Date(ratePlan.validFrom) >= new Date(ratePlan.validTo)
    ) {
      throw new BadRequestException('validFrom must be before validTo');
    }

    return this.ratePlanRepository.save(ratePlan);
  }

  /* ======================================================
     >>> REQUIRED BY BILLING (ROOM-NIGHT AUTO CHARGE)
     ====================================================== */
  async findLatestActiveForTenant(tenantId: string): Promise<RatePlan> {
    const ratePlan = await this.ratePlanRepository.findOne({
      where: {
        tenant: { id: tenantId },
        status: RatePlanStatus.ACTIVE,
      },
      order: {
        validFrom: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (!ratePlan) {
      throw new NotFoundException(
        'No active rate plan found for tenant',
      );
    }

    return ratePlan;
  }
}

/* >>> Explicit export (defensive, optional) */
