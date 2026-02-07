// File Name: concierge.service.ts
// Path: src/modules/concierge/concierge.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TransportRequest } from './entities/transport-request.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';
import { CreateTransportRequestDto } from './dto/create-transport-request.dto';

@Injectable()
export class ConciergeService {
  constructor(
    @InjectRepository(TransportRequest)
    private readonly requestRepository: Repository<TransportRequest>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async createRequest(tenantId: string, dto: CreateTransportRequestDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const guest = await this.guestRepository.findOne({
      where: { id: dto.guestId, tenant: { id: tenantId } },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    const request = this.requestRepository.create({
      tenant,
      guest,
      pickupLocation: dto.pickupLocation,
      dropoffLocation: dto.dropoffLocation,
      pickupAt: new Date(dto.pickupAt),
      status: 'PENDING',
    });

    return this.requestRepository.save(request);
  }

  async listRequests(tenantId: string) {
    return this.requestRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['guest'],
      order: { createdAt: 'DESC' },
    });
  }
}
