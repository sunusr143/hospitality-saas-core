// File Name: hr.service.ts
// Path: src/modules/hr/hr.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Shift } from './entities/shift.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { CreateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createShift(tenantId: string, dto: CreateShiftDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const staff = await this.userRepository.findOne({ where: { id: dto.staffId } });
    if (!staff) throw new NotFoundException('Staff not found');

    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (end <= start) throw new BadRequestException('endAt must be after startAt');

    const shift = this.shiftRepository.create({ tenant, staff, startAt: start, endAt: end });
    return this.shiftRepository.save(shift);
  }

  async listShifts(tenantId: string) {
    return this.shiftRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['staff'],
      order: { startAt: 'DESC' },
    });
  }
}
