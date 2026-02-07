/*
File Name: guests.service.ts
Path: src/modules/guests/guests.service.ts
*/

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Guest } from './guest.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { FindGuestsDto } from './dto/find-guests.dto';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createGuest(params: {
    tenantId: string;
    dto: CreateGuestDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const existing = await this.guestRepository.findOne({
      where: { tenant: { id: tenantId }, email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Guest with this email already exists');
    }

    const creator = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    if (!creator) {
      throw new NotFoundException('Creating user not found');
    }

    const guest = this.guestRepository.create({
      tenant,
      createdBy: creator,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      dateOfBirth: dto.dateOfBirth ?? null,
      nationality: dto.nationality ?? null,
      idType: dto.idType ?? null,
      idNumber: dto.idNumber ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      postalCode: dto.postalCode ?? null,
      country: dto.country ?? null,
      vip: dto.vip ?? false,
      marketingOptIn: dto.marketingOptIn ?? false,
      notes: dto.notes ?? null,
      isActive: dto.isActive ?? true,
    });

    return this.guestRepository.save(guest);
  }

  async findAllForTenant(tenantId: string, query?: FindGuestsDto) {
    const qb = this.guestRepository
      .createQueryBuilder('guest')
      .leftJoinAndSelect('guest.tenant', 'tenant')
      .leftJoinAndSelect('guest.createdBy', 'createdBy')
      .where('tenant.id = :tenantId', { tenantId });

    const includeInactive = query?.includeInactive === 'true';
    if (!includeInactive) {
      qb.andWhere('guest.isActive = true');
    }

    if (query?.vip !== undefined) {
      qb.andWhere('guest.vip = :vip', { vip: query.vip === 'true' });
    }

    if (query?.email) {
      qb.andWhere('LOWER(guest.email) = LOWER(:email)', {
        email: query.email,
      });
    }

    if (query?.phone) {
      qb.andWhere('guest.phone = :phone', { phone: query.phone });
    }

    if (query?.q) {
      qb.andWhere(
        '(guest.fullName ILIKE :q OR guest.email ILIKE :q OR guest.phone ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    return qb.orderBy('guest.createdAt', 'DESC').getMany();
  }

  async findOneForTenant(tenantId: string, guestId: string) {
    const guest = await this.guestRepository.findOne({
      where: { id: guestId, tenant: { id: tenantId } },
      relations: ['tenant', 'createdBy'],
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    return guest;
  }

  async updateGuest(params: {
    tenantId: string;
    guestId: string;
    dto: UpdateGuestDto;
  }) {
    const { tenantId, guestId, dto } = params;

    const guest = await this.guestRepository.findOne({
      where: { id: guestId, tenant: { id: tenantId } },
    });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    if (dto.email && dto.email !== guest.email) {
      const existing = await this.guestRepository.findOne({
        where: { tenant: { id: tenantId }, email: dto.email },
      });

      if (existing) {
        throw new ConflictException('Guest with this email already exists');
      }

      guest.email = dto.email;
    }

    if (dto.fullName !== undefined) {
      guest.fullName = dto.fullName;
    }

    if (dto.phone !== undefined) {
      guest.phone = dto.phone ?? null;
    }

    if (dto.dateOfBirth !== undefined) {
      guest.dateOfBirth = dto.dateOfBirth ?? null;
    }

    if (dto.nationality !== undefined) {
      guest.nationality = dto.nationality ?? null;
    }

    if (dto.idType !== undefined) {
      guest.idType = dto.idType ?? null;
    }

    if (dto.idNumber !== undefined) {
      guest.idNumber = dto.idNumber ?? null;
    }

    if (dto.addressLine1 !== undefined) {
      guest.addressLine1 = dto.addressLine1 ?? null;
    }

    if (dto.addressLine2 !== undefined) {
      guest.addressLine2 = dto.addressLine2 ?? null;
    }

    if (dto.city !== undefined) {
      guest.city = dto.city ?? null;
    }

    if (dto.state !== undefined) {
      guest.state = dto.state ?? null;
    }

    if (dto.postalCode !== undefined) {
      guest.postalCode = dto.postalCode ?? null;
    }

    if (dto.country !== undefined) {
      guest.country = dto.country ?? null;
    }

    if (dto.vip !== undefined) {
      guest.vip = dto.vip;
    }

    if (dto.marketingOptIn !== undefined) {
      guest.marketingOptIn = dto.marketingOptIn;
    }

    if (dto.notes !== undefined) {
      guest.notes = dto.notes ?? null;
    }

    if (dto.isActive !== undefined) {
      guest.isActive = dto.isActive;
    }

    return this.guestRepository.save(guest);
  }
}
