/**
 * File Name: reservations.service.ts
 * Path: src/modules/reservations/reservations.service.ts
 */

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Reservation, ReservationStatus } from './reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { Guest } from '../guests/guest.entity';
import { RoomStatus } from '../rooms/enums/room-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { FoliosService } from '../billing/services/folios.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,

    private readonly dataSource: DataSource,

    private readonly foliosService: FoliosService,
  ) {}

  /**
   * Create a reservation (ADMIN + STAFF)
   */
  async createReservation(params: {
    tenantId: string;
    user: { userId: string; role: UserRole };
    dto: CreateReservationDto;
  }): Promise<Reservation> {
    const {
      tenantId,
      user,
      dto,
    } = params;

    /**
     * Load room and enforce tenant isolation
     */
    const room = await this.roomRepository.findOne({
      where: {
        id: dto.roomId,
        tenant: { id: tenantId },
      },
      relations: ['tenant'],
    });

    if (!room) {
      throw new NotFoundException('Room not found for this tenant');
    }

    if (room.status !== RoomStatus.AVAILABLE) {
      throw new BadRequestException('Room is not available for reservation');
    }

    /**
     * Resolve real DB user from JWT payload
     */
    const creator = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    if (!creator) {
      throw new NotFoundException('Creating user not found');
    }

    /**
     * OVERLAP DETECTION
     */
    const overlappingReservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .innerJoin('reservation.room', 'room')
      .where('room.id = :roomId', { roomId: dto.roomId })
      .andWhere('reservation.status IN (:...activeStatuses)', {
        activeStatuses: [
          ReservationStatus.PENDING,
          ReservationStatus.CONFIRMED,
          ReservationStatus.CHECKED_IN,
        ],
      })
      .andWhere(
        `
        daterange(reservation."checkInDate", reservation."checkOutDate", '[]')
        && daterange(:checkInDate, :checkOutDate, '[]')
        `,
        { checkInDate: dto.checkInDate, checkOutDate: dto.checkOutDate },
      )
      .getOne();

    if (overlappingReservation) {
      throw new ConflictException(
        'Room already has an overlapping reservation',
      );
    }

    /**
     * Create reservation
     */
    let guest: Guest | null = null;
    if (dto.guestId) {
      guest = await this.guestRepository.findOne({
        where: { id: dto.guestId, tenant: { id: tenantId } },
      });

      if (!guest) {
        throw new NotFoundException('Guest not found');
      }
    } else if (dto.guestEmail) {
      guest = await this.guestRepository.findOne({
        where: { email: dto.guestEmail, tenant: { id: tenantId } },
      });
    }

    const fallbackName = dto.guestFullName ?? dto.guestName;
    if (!guest && !fallbackName) {
      throw new BadRequestException('guestFullName is required without guestId');
    }

    if (!guest && dto.guestEmail) {
      guest = this.guestRepository.create({
        tenant: room.tenant,
        createdBy: creator,
        fullName: fallbackName!,
        email: dto.guestEmail,
        phone: dto.guestPhone ?? null,
        isActive: true,
      });

      guest = await this.guestRepository.save(guest);
    }

    const reservation = this.reservationRepository.create({
      guestName: guest ? guest.fullName : fallbackName!,
      guestEmail: guest ? guest.email : dto.guestEmail ?? '',
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      status: ReservationStatus.PENDING,
      tenant: room.tenant,
      room,
      createdBy: creator,
      guest,
    });

    this.logger.log(
      `Creating reservation for room ${room.id} by user ${creator.id}`,
    );

    return this.reservationRepository.save(reservation);
  }

  /**
   * List reservations (ADMIN + STAFF)
   */
  async findAllForTenant(tenantId: string): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['room', 'createdBy', 'guest'],
      order: { checkInDate: 'ASC' },
    });
  }

  /**
   * Change reservation status
   * ADMIN only
   */
  async changeStatus(params: {
    tenantId: string;
    reservationId: string;
    newStatus: ReservationStatus;
    user: { userId: string; role: UserRole };
  }): Promise<Reservation> {
    const { tenantId, reservationId, newStatus, user } = params;

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only ADMIN can change reservation status',
      );
    }

    const reservation = await this.reservationRepository.findOne({
      where: {
        id: reservationId,
        tenant: { id: tenantId },
      },
      relations: ['room'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    this.validateStatusTransition(reservation.status, newStatus);

    await this.dataSource.transaction(async (manager) => {
      reservation.status = newStatus;
      await manager.save(reservation);

      if (newStatus === ReservationStatus.CHECKED_IN) {
        reservation.room.status = RoomStatus.OCCUPIED;
        await manager.save(reservation.room);
      }

      if (newStatus === ReservationStatus.CHECKED_OUT) {
        reservation.room.status = RoomStatus.AVAILABLE;
        await manager.save(reservation.room);
      }
    });

    if (newStatus === ReservationStatus.CHECKED_OUT) {
      await this.foliosService.addRoomNightCharge({
        tenantId,
        reservation,
      });

      await this.foliosService.closeFolioSystemByReservation(
        tenantId,
        reservation.id,
      );
    }

    this.logger.log(
      `Reservation ${reservation.id} moved to ${newStatus} by ADMIN ${user.userId}`,
    );

    return reservation;
  }

  /**
   * Enforce lifecycle transitions
   */
  private validateStatusTransition(
    current: ReservationStatus,
    next: ReservationStatus,
  ): void {
    const allowedTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [
        ReservationStatus.CONFIRMED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.CONFIRMED]: [
        ReservationStatus.CHECKED_IN,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.CHECKED_IN]: [
        ReservationStatus.CHECKED_OUT,
      ],
      [ReservationStatus.CHECKED_OUT]: [],
      [ReservationStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid reservation status transition from ${current} to ${next}`,
      );
    }
  }
}
