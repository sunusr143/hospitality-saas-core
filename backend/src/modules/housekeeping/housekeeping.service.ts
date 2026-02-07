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
import { AssignHousekeepingDto } from './dto/assign-housekeeping.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { HousekeepingStatus } from './enums/housekeeping-status.enum';
import { User } from '../users/user.entity';
import { HousekeepingInspection } from './entities/housekeeping-inspection.entity';

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(HousekeepingTask)
    private readonly taskRepo: Repository<HousekeepingTask>,
    @InjectRepository(HousekeepingInspection)
    private readonly inspectionRepo: Repository<HousekeepingInspection>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(tenantId: string, dto: CreateHousekeepingTaskDto) {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const room = await this.roomRepo.findOne({
      where: { id: dto.roomId, tenant: { id: tenantId } },
    });
    if (!room) throw new NotFoundException('Room not found');

    const task = this.taskRepo.create({
      tenant,
      room,
      priority: dto.priority,
      notes: dto.notes ?? null,
      dueAt: null,
    });

    return this.taskRepo.save(task);
  }

  async findAll(tenantId: string) {
    return this.taskRepo.find({
      where: { tenant: { id: tenantId } },
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

  async assignTask(tenantId: string, taskId: string, dto: AssignHousekeepingDto) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, tenant: { id: tenantId } },
    });
    if (!task) throw new NotFoundException('Housekeeping task not found');

    const assignee = await this.userRepo.findOne({ where: { id: dto.assignedToId } });
    if (!assignee) throw new NotFoundException('User not found');

    task.assignedTo = assignee;
    task.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    return this.taskRepo.save(task);
  }

  async createInspection(tenantId: string, dto: CreateInspectionDto, userId: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const room = await this.roomRepo.findOne({
      where: { id: dto.roomId, tenant: { id: tenantId } },
    });
    if (!room) throw new NotFoundException('Room not found');

    const inspector = await this.userRepo.findOne({ where: { id: userId } });
    if (!inspector) throw new NotFoundException('User not found');

    const inspection = this.inspectionRepo.create({
      tenant,
      room,
      inspector,
      passed: dto.passed,
      notes: dto.notes ?? null,
    });

    return this.inspectionRepo.save(inspection);
  }

  async listInspections(tenantId: string) {
    return this.inspectionRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['room', 'inspector'],
      order: { createdAt: 'DESC' },
    });
  }
}
