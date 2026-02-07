/*
File Name: inventory.service.ts
Path: src/modules/inventory/inventory.service.ts
*/

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OutOfOrder } from './entities/out-of-order.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { RoomStatus } from '../rooms/enums/room-status.enum';
import { OutOfOrderStatus } from './enums/out-of-order-status.enum';
import { CreateOutOfOrderDto } from './dto/create-out-of-order.dto';
import { ResolveOutOfOrderDto } from './dto/resolve-out-of-order.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(OutOfOrder)
    private readonly oooRepository: Repository<OutOfOrder>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async markOutOfOrder(params: {
    tenantId: string;
    dto: CreateOutOfOrderDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const room = await this.roomRepository.findOne({
      where: { id: dto.roomId, tenant: { id: tenantId } },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const reporter = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!reporter) {
      throw new NotFoundException('User not found');
    }

    if (dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const ooo = this.oooRepository.create({
      tenant,
      room,
      reportedBy: reporter,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      reason: dto.reason ?? null,
      status: OutOfOrderStatus.ACTIVE,
    });

    room.status = RoomStatus.MAINTENANCE;
    await this.roomRepository.save(room);

    return this.oooRepository.save(ooo);
  }

  async resolveOutOfOrder(params: { tenantId: string; id: string; dto: ResolveOutOfOrderDto }) {
    const { tenantId, id, dto } = params;

    const ooo = await this.oooRepository.findOne({
      where: { id, tenant: { id: tenantId } },
      relations: ['room'],
    });

    if (!ooo) {
      throw new NotFoundException('Out-of-order record not found');
    }

    if (ooo.status === OutOfOrderStatus.RESOLVED) {
      return ooo;
    }

    ooo.status = OutOfOrderStatus.RESOLVED;
    ooo.endDate = dto.endDate ?? ooo.endDate ?? new Date().toISOString().slice(0, 10);

    if (ooo.room.status === RoomStatus.MAINTENANCE) {
      ooo.room.status = RoomStatus.AVAILABLE;
      await this.roomRepository.save(ooo.room);
    }

    return this.oooRepository.save(ooo);
  }

  async listOutOfOrder(tenantId: string) {
    return this.oooRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['room', 'reportedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
