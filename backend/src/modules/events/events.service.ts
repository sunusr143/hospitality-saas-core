// File Name: events.service.ts
// Path: src/modules/events/events.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event } from './entities/event.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async createEvent(tenantId: string, dto: CreateEventDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (end <= start) throw new BadRequestException('endAt must be after startAt');

    const event = this.eventRepository.create({
      tenant,
      name: dto.name,
      startAt: start,
      endAt: end,
      expectedGuests: dto.expectedGuests,
      notes: dto.notes ?? null,
    });

    return this.eventRepository.save(event);
  }

  async listEvents(tenantId: string) {
    return this.eventRepository.find({
      where: { tenant: { id: tenantId } },
      order: { startAt: 'DESC' },
    });
  }
}
