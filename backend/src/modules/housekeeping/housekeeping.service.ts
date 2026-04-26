// File Name: housekeeping.service.ts
// Path: src/modules/housekeeping/housekeeping.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HousekeepingTask } from './entities/housekeeping-task.entity';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingStatusDto } from './dto/update-housekeeping-status.dto';
import { AssignHousekeepingDto } from './dto/assign-housekeeping.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { HousekeepingStatus } from './enums/housekeeping-status.enum';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { HousekeepingInspection } from './entities/housekeeping-inspection.entity';
import { RoomStatus } from '../rooms/enums/room-status.enum';
import { MaintenanceService } from '../maintenance/maintenance.service';

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
    private readonly maintenanceService: MaintenanceService,
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

    const savedTask = await this.taskRepo.save(task);
    await this.markRoomUnavailableForHousekeeping(room);

    return savedTask;
  }

  async findAll(tenantId: string) {
    return this.taskRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['room', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    tenantId: string,
    taskId: string,
    dto: UpdateHousekeepingStatusDto,
  ) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, tenant: { id: tenantId } },
      relations: ['room', 'tenant'],
    });
    if (!task) throw new NotFoundException('Housekeeping task not found');

    if (task.status === HousekeepingStatus.COMPLETED) {
      throw new BadRequestException('Completed tasks cannot be modified');
    }

    task.status = dto.status;
    const savedTask = await this.taskRepo.save(task);

    if (this.isActiveHousekeepingStatus(savedTask.status)) {
      await this.markRoomUnavailableForHousekeeping(savedTask.room);
    } else {
      await this.releaseRoomAfterHousekeepingIfClear(savedTask);
    }

    return savedTask;
  }

  async assignTask(tenantId: string, taskId: string, dto: AssignHousekeepingDto) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, tenant: { id: tenantId } },
      relations: ['room'],
    });
    if (!task) throw new NotFoundException('Housekeeping task not found');

    const assignee = await this.userRepo.findOne({
      where: { id: dto.assignedToId, tenant: { id: tenantId } },
    });
    if (!assignee) throw new NotFoundException('User not found');
    this.ensureAssignableHousekeeper(assignee);

    task.assignedTo = assignee;
    task.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (task.status === HousekeepingStatus.PENDING) {
      task.status = HousekeepingStatus.ASSIGNED;
    }

    const savedTask = await this.taskRepo.save(task);
    await this.markRoomUnavailableForHousekeeping(savedTask.room);

    return savedTask;
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

    const savedInspection = await this.inspectionRepo.save(inspection);

    // If inspection failed, create maintenance request and block room
    if (!dto.passed) {
      await this.handleFailedInspection({
        tenantId,
        room,
        inspector,
      });
    }

    return savedInspection;
  }

  /**
   * Handle failed inspection by creating maintenance request and blocking room
   */
  private async handleFailedInspection(params: {
    tenantId: string;
    room: Room;
    inspector: User;
  }) {
    const { tenantId, room, inspector } = params;

    // Create a maintenance request for the failed inspection
    await this.maintenanceService.createRequest({
      tenantId,
      dto: {
        roomId: room.id,
        title: `Room Maintenance Required - Failed Inspection (${room.roomNumber})`,
        description: 'Room failed housekeeping inspection and requires maintenance before it can be used again.',
      },
      user: { userId: inspector.id },
    });

    // Block the room by changing its status to MAINTENANCE
    room.status = RoomStatus.MAINTENANCE;
    await this.roomRepo.save(room);
  }

  private async markRoomUnavailableForHousekeeping(room: Room) {
    if (room.status === RoomStatus.OCCUPIED || room.status === RoomStatus.MAINTENANCE) {
      return;
    }

    room.status = RoomStatus.MAINTENANCE;
    await this.roomRepo.save(room);
  }

  private async releaseRoomAfterHousekeepingIfClear(task: HousekeepingTask) {
    if (task.room.status !== RoomStatus.MAINTENANCE) {
      return;
    }

    const activeHousekeepingTasks = await this.taskRepo.count({
      where: {
        tenant: { id: task.tenant.id },
        room: { id: task.room.id },
        status: In([
          HousekeepingStatus.PENDING,
          HousekeepingStatus.ASSIGNED,
          HousekeepingStatus.IN_PROGRESS,
        ]),
      },
    });
    const hasActiveMaintenanceRequest =
      await this.maintenanceService.hasActiveRequestForRoom(task.tenant.id, task.room.id);

    if (activeHousekeepingTasks === 0 && !hasActiveMaintenanceRequest) {
      task.room.status = RoomStatus.AVAILABLE;
      await this.roomRepo.save(task.room);
    }
  }

  private isActiveHousekeepingStatus(status: HousekeepingStatus) {
    return [
      HousekeepingStatus.PENDING,
      HousekeepingStatus.ASSIGNED,
      HousekeepingStatus.IN_PROGRESS,
    ].includes(status);
  }

  async listInspections(tenantId: string) {
    return this.inspectionRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['room', 'inspector'],
      order: { createdAt: 'DESC' },
    });
  }

  private ensureAssignableHousekeeper(user: User) {
    const department = String(user.department ?? '').toLowerCase();
    const roleCanReceiveWork = [UserRole.STAFF, UserRole.MANAGER].includes(user.role);

    if (!user.isActive || !roleCanReceiveWork || department !== 'housekeeping') {
      throw new BadRequestException('Housekeeping tasks can only be assigned to active housekeeping staff');
    }
  }
}
