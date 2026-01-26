// File Name: housekeeping.service.ts
// Path: src/modules/housekeeping/housekeeping.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HousekeepingTask } from './entities/housekeeping-task.entity';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingStatusDto } from './dto/update-housekeeping-status.dto';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { HousekeepingStatus } from './enums/housekeeping-status.enum';

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(HousekeepingTask)
    private readonly taskRepo: Repository<HousekeepingTask>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
  ) {}

  async create(tenantCode: string, dto: CreateHousekeepingTaskDto) {
    const tenant = await this.tenantRepo.findOne({ where: { code: tenantCode } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const room = await this.roomRepo.findOne({
      where: { id: dto.roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    const task = this.taskRepo.create({
      tenant,
      room,
      priority: dto.priority,
      notes: dto.notes ?? null,
    });

    return this.taskRepo.save(task);
  }

  async findAll(tenantCode: string) {
    return this.taskRepo.find({
      where: { tenant: { code: tenantCode } },
      relations: ['room', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    taskId: string,
    dto: UpdateHousekeepingStatusDto,
  ) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Housekeeping task not found');

    if (task.status === HousekeepingStatus.COMPLETED) {
      throw new BadRequestException('Completed tasks cannot be modified');
    }

    task.status = dto.status;
    return this.taskRepo.save(task);
  }
}
