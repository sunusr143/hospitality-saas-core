/*
File Name: rooms.service.ts
Path: src/modules/rooms/rooms.service.ts
*/

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from './room.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomStatus } from './enums/room-status.enum';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
  const tenant = await this.tenantRepository.findOne({
    where: { code: dto.tenantCode },
  });

  if (!tenant) {
    throw new BadRequestException('Invalid tenant');
  }

  const room = this.roomRepository.create({
    roomNumber: dto.roomNumber,
    roomType: dto.roomType,
    capacity: dto.capacity,
    tenant,
  });

  try {
    return await this.roomRepository.save(room);
  } catch (error) {
    if (error.code === '23505') {
      // PostgreSQL unique violation
      throw new BadRequestException(
        'Room with this number already exists for this hotel',
      );
    }
    throw error;
  }
}


  async findAll(tenantCode?: string): Promise<Room[]> {
    const where = tenantCode ? { tenant: { code: tenantCode } } : {};

    return this.roomRepository.find({
      where,
      relations: ['tenant'],
      order: { roomNumber: 'ASC' },
    });
  }

  async updateStatus(roomId: string, newStatus: RoomStatus): Promise<Room> {
  const room = await this.roomRepository.findOne({
    where: { id: roomId },
  });

  if (!room) {
    throw new BadRequestException('Room not found');
  }

  // Allowed transitions
  if (
    room.status === RoomStatus.OCCUPIED &&
    newStatus === RoomStatus.MAINTENANCE
  ) {
    throw new BadRequestException(
      'Cannot move occupied room to maintenance',
    );
  }

  room.status = newStatus;
  return this.roomRepository.save(room);
  }
}