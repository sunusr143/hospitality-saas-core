// File Name: laundry.service.ts
// Path: src/modules/laundry/laundry.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LaundryOrder } from './entities/laundry-order.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';
import { CreateLaundryOrderDto } from './dto/create-laundry-order.dto';

@Injectable()
export class LaundryService {
  constructor(
    @InjectRepository(LaundryOrder)
    private readonly orderRepository: Repository<LaundryOrder>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async createOrder(tenantId: string, dto: CreateLaundryOrderDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const guest = await this.guestRepository.findOne({
      where: { id: dto.guestId, tenant: { id: tenantId } },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    const order = this.orderRepository.create({
      tenant,
      guest,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency,
      completed: false,
    });

    return this.orderRepository.save(order);
  }

  async listOrders(tenantId: string) {
    return this.orderRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['guest'],
      order: { createdAt: 'DESC' },
    });
  }
}
