/*
File Name: rms.service.ts
Path: src/modules/rms/rms.service.ts
*/

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RateCalendar } from './entities/rate-calendar.entity';
import { Availability } from './entities/availability.entity';
import { Restriction } from './entities/restriction.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RatePlan } from '../rate-plans/entities/rate-plan.entity';

import { SetRateDto } from './dto/set-rate.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { SetRestrictionDto } from './dto/set-restriction.dto';
import { RmsQueryDto } from './dto/rms-query.dto';

@Injectable()
export class RmsService {
  constructor(
    @InjectRepository(RateCalendar)
    private readonly rateRepository: Repository<RateCalendar>,

    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,

    @InjectRepository(Restriction)
    private readonly restrictionRepository: Repository<Restriction>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(RatePlan)
    private readonly ratePlanRepository: Repository<RatePlan>,
  ) {}

  async upsertRate(tenantId: string, dto: SetRateDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    let ratePlan: RatePlan | null = null;
    if (dto.ratePlanId) {
      ratePlan = await this.ratePlanRepository.findOne({ where: { id: dto.ratePlanId, tenant: { id: tenantId } } });
      if (!ratePlan) {
        throw new NotFoundException('Rate plan not found');
      }
    }

    const existing = await this.rateRepository.findOne({
      where: { tenant: { id: tenantId }, roomType: dto.roomType, date: dto.date },
    });

    const record = existing ?? this.rateRepository.create({ tenant, roomType: dto.roomType, date: dto.date });
    record.baseRate = dto.baseRate;
    record.currency = dto.currency;
    record.ratePlan = ratePlan;

    return this.rateRepository.save(record);
  }

  async upsertAvailability(tenantId: string, dto: SetAvailabilityDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    if (dto.availableRooms > dto.totalRooms) {
      throw new BadRequestException('availableRooms cannot exceed totalRooms');
    }

    const existing = await this.availabilityRepository.findOne({
      where: { tenant: { id: tenantId }, roomType: dto.roomType, date: dto.date },
    });

    const record = existing ?? this.availabilityRepository.create({ tenant, roomType: dto.roomType, date: dto.date });
    record.totalRooms = dto.totalRooms;
    record.availableRooms = dto.availableRooms;
    record.stopSell = dto.stopSell;

    return this.availabilityRepository.save(record);
  }

  async upsertRestriction(tenantId: string, dto: SetRestrictionDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    if (dto.maxStay !== undefined && dto.maxStay < dto.minStay) {
      throw new BadRequestException('maxStay must be >= minStay');
    }

    const existing = await this.restrictionRepository.findOne({
      where: { tenant: { id: tenantId }, roomType: dto.roomType, date: dto.date },
    });

    const record = existing ?? this.restrictionRepository.create({ tenant, roomType: dto.roomType, date: dto.date });
    record.minStay = dto.minStay;
    record.maxStay = dto.maxStay ?? null;
    record.closedToArrival = dto.closedToArrival;
    record.closedToDeparture = dto.closedToDeparture;
    record.closed = dto.closed;

    return this.restrictionRepository.save(record);
  }

  async listRates(tenantId: string, query: RmsQueryDto) {
    if (query.to <= query.from) {
      throw new BadRequestException('to must be after from');
    }
    const qb = this.rateRepository
      .createQueryBuilder('rate')
      .leftJoinAndSelect('rate.ratePlan', 'ratePlan')
      .leftJoin('rate.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('rate.date >= :from', { from: query.from })
      .andWhere('rate.date <= :to', { to: query.to });

    if (query.roomType) {
      qb.andWhere('rate.roomType = :roomType', { roomType: query.roomType });
    }

    return qb.orderBy('rate.date', 'ASC').getMany();
  }

  async listAvailability(tenantId: string, query: RmsQueryDto) {
    if (query.to <= query.from) {
      throw new BadRequestException('to must be after from');
    }
    const qb = this.availabilityRepository
      .createQueryBuilder('avail')
      .leftJoin('avail.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('avail.date >= :from', { from: query.from })
      .andWhere('avail.date <= :to', { to: query.to });

    if (query.roomType) {
      qb.andWhere('avail.roomType = :roomType', { roomType: query.roomType });
    }

    return qb.orderBy('avail.date', 'ASC').getMany();
  }

  async listRestrictions(tenantId: string, query: RmsQueryDto) {
    if (query.to <= query.from) {
      throw new BadRequestException('to must be after from');
    }
    const qb = this.restrictionRepository
      .createQueryBuilder('restriction')
      .leftJoin('restriction.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('restriction.date >= :from', { from: query.from })
      .andWhere('restriction.date <= :to', { to: query.to });

    if (query.roomType) {
      qb.andWhere('restriction.roomType = :roomType', { roomType: query.roomType });
    }

    return qb.orderBy('restriction.date', 'ASC').getMany();
  }
}
