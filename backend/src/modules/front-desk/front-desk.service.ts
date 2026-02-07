/*
File Name: front-desk.service.ts
Path: src/modules/front-desk/front-desk.service.ts
*/

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { RoomMoveLog } from './entities/room-move-log.entity';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RoomStatus } from '../rooms/enums/room-status.enum';
import { RoomMoveDto } from './dto/room-move.dto';

@Injectable()
export class FrontDeskService {
  constructor(
    @InjectRepository(RoomMoveLog)
    private readonly moveLogRepository: Repository<RoomMoveLog>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    private readonly dataSource: DataSource,
  ) {}

  async moveRoom(params: { tenantId: string; dto: RoomMoveDto; user: { userId: string } }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, tenant: { id: tenantId } },
      relations: ['room', 'tenant'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const toRoom = await this.roomRepository.findOne({
      where: { id: dto.toRoomId, tenant: { id: tenantId } },
    });

    if (!toRoom) {
      throw new NotFoundException('Target room not found');
    }

    if (reservation.room.id === toRoom.id) {
      throw new BadRequestException('Room is already assigned');
    }

    if (toRoom.status !== RoomStatus.AVAILABLE) {
      throw new BadRequestException('Target room not available');
    }

    const mover = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!mover) {
      throw new NotFoundException('User not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const fromRoom = reservation.room;

      reservation.room = toRoom;
      await manager.save(reservation);

      if (reservation.status === ReservationStatus.CHECKED_IN) {
        fromRoom.status = RoomStatus.AVAILABLE;
        toRoom.status = RoomStatus.OCCUPIED;
        await manager.save(fromRoom);
        await manager.save(toRoom);
      }

      const log = manager.getRepository(RoomMoveLog).create({
        tenant,
        reservation,
        fromRoom,
        toRoom,
        movedBy: mover,
        reason: dto.reason ?? null,
      });

      return manager.getRepository(RoomMoveLog).save(log);
    });
  }
}
