/*
File Name: maintenance.service.ts
Path: src/modules/maintenance/maintenance.service.ts
*/

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { AssignMaintenanceDto } from './dto/assign-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MaintenanceStatus } from './enums/maintenance-status.enum';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private readonly requestRepository: Repository<MaintenanceRequest>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createRequest(params: {
    tenantId: string;
    dto: CreateMaintenanceRequestDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const room = await this.roomRepository.findOne({
      where: { id: dto.roomId, tenant: { id: tenantId } },
    });
    if (!room) throw new NotFoundException('Room not found');

    const reporter = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!reporter) throw new NotFoundException('User not found');

    const request = this.requestRepository.create({
      tenant,
      room,
      reportedBy: reporter,
      assignedTo: null,
      title: dto.title,
      description: dto.description ?? null,
      status: MaintenanceStatus.OPEN,
      resolvedAt: null,
    });

    return this.requestRepository.save(request);
  }

  async assignRequest(tenantId: string, requestId: string, dto: AssignMaintenanceDto) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, tenant: { id: tenantId } },
    });
    if (!request) throw new NotFoundException('Request not found');

    const assignee = await this.userRepository.findOne({ where: { id: dto.assignedToId } });
    if (!assignee) throw new NotFoundException('User not found');

    request.assignedTo = assignee;
    request.status = MaintenanceStatus.IN_PROGRESS;
    return this.requestRepository.save(request);
  }

  async updateStatus(tenantId: string, requestId: string, dto: UpdateMaintenanceStatusDto) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, tenant: { id: tenantId } },
    });
    if (!request) throw new NotFoundException('Request not found');

    if (request.status === MaintenanceStatus.RESOLVED) {
      throw new BadRequestException('Resolved request cannot be modified');
    }

    request.status = dto.status;
    if (dto.status === MaintenanceStatus.RESOLVED) {
      request.resolvedAt = new Date();
    }

    return this.requestRepository.save(request);
  }

  async listRequests(tenantId: string) {
    return this.requestRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['room', 'reportedBy', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }
}
