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
import { RmsService } from '../rms/rms.service';
import { FoliosService } from '../billing/services/folios.service';
import { FolioLineItemType } from '../billing/enums/folio-line-item-type.enum';
import { Folio } from '../billing/entities/folio.entity';

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

    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,

    private readonly rmsService: RmsService,
    private readonly foliosService: FoliosService,
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

      const savedLog = await manager.getRepository(RoomMoveLog).save(log);

      // Handle billing adjustment if folio exists
      if (reservation.status === ReservationStatus.CHECKED_IN) {
        await this.handleRoomMoveBilling({
          tenantId,
          reservation,
          fromRoom,
          toRoom,
          user,
        });
      }

      return savedLog;
    });
  }

  /**
   * Handle billing adjustment for room moves
   * Calculates rate difference between old and new room for remaining nights
   */
  private async handleRoomMoveBilling(params: {
    tenantId: string;
    reservation: Reservation;
    fromRoom: Room;
    toRoom: Room;
    user: { userId: string };
  }) {
    const { tenantId, reservation, fromRoom, toRoom, user } = params;

    // Find the active folio for this reservation
    const folio = await this.folioRepository.findOne({
      where: {
        tenant: { id: tenantId },
        reservation: { id: reservation.id },
      },
    });

    if (!folio) {
      // No folio exists yet - it will be created at checkout with the new room
      return;
    }

    // Calculate remaining nights from today until checkout
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(reservation.checkOutDate);
    checkOutDate.setHours(0, 0, 0, 0);

    const remainingNights = Math.ceil(
      (checkOutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (remainingNights <= 0) {
      // No remaining nights to charge for
      return;
    }

    // Get rates for both rooms for remaining nights
    const fromRoomRates = await this.rmsService.getRatesByDateRange(
      tenantId,
      fromRoom.roomType,
      today.toISOString().split('T')[0],
      reservation.checkOutDate,
    );

    const toRoomRates = await this.rmsService.getRatesByDateRange(
      tenantId,
      toRoom.roomType,
      today.toISOString().split('T')[0],
      reservation.checkOutDate,
    );

    // Calculate total rates for remaining stay
    const fromRoomTotal = fromRoomRates.reduce((sum, rate) => sum + rate.baseRate, 0);
    const toRoomTotal = toRoomRates.reduce((sum, rate) => sum + rate.baseRate, 0);

    // Calculate the adjustment amount
    const adjustmentAmount = toRoomTotal - fromRoomTotal;

    // If there's a rate difference, add adjustment to folio
    if (adjustmentAmount !== 0) {
      const description =
        adjustmentAmount > 0
          ? `Room upgrade from ${fromRoom.roomType} to ${toRoom.roomType}`
          : `Room downgrade from ${fromRoom.roomType} to ${toRoom.roomType}`;

      await this.foliosService.addLineItem({
        tenantId,
        folioId: folio.id,
        dto: {
          type: FolioLineItemType.ADJUSTMENT,
          description,
          quantity: 1,
          unitPrice: adjustmentAmount,
          currency: folio.currency || 'INR',
          relatedEntityType: 'RoomMove',
          relatedEntityId: fromRoom.id, // Track which room we moved from
        },
        user: {
          userId: user.userId,
          role: 'ADMIN', // Room moves are typically admin-initiated
        } as any, // Type assertion needed - adjust as per actual UserRole enum
      });
    }
  }
}
