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
import { RatePlanStatus } from '../rate-plans/enums/rate-plan-status.enum';

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

  /* ======================================================
     RATE CALCULATION HELPERS (for billing & checkout)
     ====================================================== */

  /**
   * Get rate for specific room type on specific date.
   * Used during checkout to calculate room night charges.
   * Falls back to RatePlan if no RMS rate exists.
   */
  async getRateByDateAndRoomType(
    tenantId: string,
    roomType: string,
    date: string,
  ): Promise<{ baseRate: number; currency: string; source: 'RMS' | 'RatePlan' | null }> {
    // First, try to find RMS rate
    const rmsRate = await this.rateRepository.findOne({
      where: {
        tenant: { id: tenantId },
        roomType,
        date,
      },
    });

    if (rmsRate) {
      return {
        baseRate: Number(rmsRate.baseRate),
        currency: rmsRate.currency || 'INR',
        source: 'RMS',
      };
    }

    // Fallback to RatePlan
    const ratePlan = await this.ratePlanRepository.findOne({
      where: {
        tenant: { id: tenantId },
        status: RatePlanStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (ratePlan) {
      return {
        baseRate: Number(ratePlan.basePrice),
        currency: 'INR',
        source: 'RatePlan',
      };
    }

    return {
      baseRate: 0,
      currency: 'INR',
      source: null,
    };
  }

  /**
   * Get rates for a date range (used for multi-night stay calculation).
   * Returns per-day rates from RMS if available, fallback to RatePlan.
   */
  async getRatesByDateRange(
    tenantId: string,
    roomType: string,
    checkInDate: string,
    checkOutDate: string,
  ): Promise<Array<{ date: string; baseRate: number; currency: string; source: 'RMS' | 'RatePlan' }>> {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const rates: Array<{ date: string; baseRate: number; currency: string; source: 'RMS' | 'RatePlan' }> = [];

    // Get fallback RatePlan rate
    const fallbackRate = await this.getRateByDateAndRoomType(tenantId, roomType, checkInDate);

    // Generate rate for each night
    let current = new Date(checkIn);
    while (current < checkOut) {
      const dateStr = current.toISOString().split('T')[0];

      const rmsRate = await this.rateRepository.findOne({
        where: {
          tenant: { id: tenantId },
          roomType,
          date: dateStr,
        },
      });

      rates.push({
        date: dateStr,
        baseRate: rmsRate ? Number(rmsRate.baseRate) : fallbackRate.baseRate,
        currency: rmsRate ? rmsRate.currency : fallbackRate.currency,
        source: rmsRate ? 'RMS' : 'RatePlan',
      });

      current.setDate(current.getDate() + 1);
    }

    return rates;
  }

  /**
   * Check if booking is allowed on given date for room type.
   * Checks restrictions and availability.
   */
  async isBookingAllowed(
    tenantId: string,
    roomType: string,
    checkInDate: string,
    checkOutDate: string,
    stayLength: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    let current = new Date(checkIn);

    // Check restrictions for each day
    while (current < checkOut) {
      const dateStr = current.toISOString().split('T')[0];

      const restriction = await this.restrictionRepository.findOne({
        where: {
          tenant: { id: tenantId },
          roomType,
          date: dateStr,
        },
      });

      if (restriction) {
        // Check if fully closed
        if (restriction.closed) {
          return {
            allowed: false,
            reason: `Room type closed on ${dateStr}`,
          };
        }

        // Check if closed to arrival on check-in date
        if (dateStr === checkInDate && restriction.closedToArrival) {
          return {
            allowed: false,
            reason: `Cannot arrive on ${dateStr}`,
          };
        }

        // Check if closed to departure on check-out date
        if (dateStr === checkOutDate && restriction.closedToDeparture) {
          return {
            allowed: false,
            reason: `Cannot depart on ${dateStr}`,
          };
        }

        // Check min/max stay constraints
        if (stayLength < restriction.minStay) {
          return {
            allowed: false,
            reason: `Minimum stay is ${restriction.minStay} nights`,
          };
        }

        if (restriction.maxStay && stayLength > restriction.maxStay) {
          return {
            allowed: false,
            reason: `Maximum stay is ${restriction.maxStay} nights`,
          };
        }
      }

      current.setDate(current.getDate() + 1);
    }

    // Check availability
    const availability = await this.availabilityRepository.findOne({
      where: {
        tenant: { id: tenantId },
        roomType,
        date: checkInDate,
      },
    });

    if (availability && availability.stopSell) {
      return {
        allowed: false,
        reason: `${roomType} is stop-sold on ${checkInDate}`,
      };
    }

    return { allowed: true };
  }
}
