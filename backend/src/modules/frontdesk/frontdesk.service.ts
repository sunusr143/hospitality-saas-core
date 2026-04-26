// File Name: frontdesk.service.ts
// Path: src/modules/frontdesk/frontdesk.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  Reservation,
  ReservationStatus,
} from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { Guest } from '../guests/guest.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RoomStatus } from '../rooms/enums/room-status.enum';
import { FoliosService } from '../billing/services/folios.service';
import { Folio } from '../billing/entities/folio.entity';
import { FolioStatus } from '../billing/enums/folio-status.enum';
import { MaintenanceRequest } from '../maintenance/entities/maintenance-request.entity';
import { MaintenanceStatus } from '../maintenance/enums/maintenance-status.enum';

import { GuestDocument } from './entities/guest-document.entity';
import { Deposit } from './entities/deposit.entity';

import { CheckinDto } from './dto/checkin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { VerifyGuestDocumentDto } from './dto/verify-guest-document.dto';
import { CollectDepositDto } from './dto/collect-deposit.dto';

@Injectable()
export class FrontdeskService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(GuestDocument)
    private readonly documentRepository: Repository<GuestDocument>,

    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,

    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,

    @InjectRepository(MaintenanceRequest)
    private readonly maintenanceRepository: Repository<MaintenanceRequest>,

    private readonly foliosService: FoliosService,
  ) {}

  async getDashboard(params: { tenantId: string; date?: string }) {
    const { tenantId } = params;
    const businessDate = this.normalizeBusinessDate(params.date);

    const [totalRooms, roomsByStatusRows, arrivals, departures, inHouse] =
      await Promise.all([
        this.roomRepository.count({
          where: { tenant: { id: tenantId } },
        }),
        this.roomRepository
          .createQueryBuilder('room')
          .select('room.status', 'status')
          .addSelect('COUNT(*)::int', 'count')
          .where('room.tenantId = :tenantId', { tenantId })
          .groupBy('room.status')
          .getRawMany<{ status: RoomStatus; count: number }>(),
        this.reservationRepository.find({
          where: {
            tenant: { id: tenantId },
            checkInDate: businessDate,
            status: In([
              ReservationStatus.PENDING,
              ReservationStatus.CONFIRMED,
              ReservationStatus.CHECKED_IN,
            ]),
          },
          relations: ['room', 'guest'],
          order: { createdAt: 'ASC' },
        }),
        this.reservationRepository.find({
          where: {
            tenant: { id: tenantId },
            checkOutDate: businessDate,
            status: In([
              ReservationStatus.CONFIRMED,
              ReservationStatus.CHECKED_IN,
            ]),
          },
          relations: ['room', 'guest'],
          order: { createdAt: 'ASC' },
        }),
        this.reservationRepository
          .createQueryBuilder('reservation')
          .leftJoinAndSelect('reservation.room', 'room')
          .leftJoinAndSelect('reservation.guest', 'guest')
          .where('reservation.tenantId = :tenantId', { tenantId })
          .andWhere('reservation.status = :status', {
            status: ReservationStatus.CHECKED_IN,
          })
          .andWhere('reservation.checkInDate <= :businessDate', {
            businessDate,
          })
          .andWhere('reservation.checkOutDate > :businessDate', {
            businessDate,
          })
          .orderBy('room.roomNumber', 'ASC')
          .addOrderBy('reservation.checkOutDate', 'ASC')
          .getMany(),
      ]);

    const roomStatusCounts = {
      [RoomStatus.AVAILABLE]: 0,
      [RoomStatus.OCCUPIED]: 0,
      [RoomStatus.MAINTENANCE]: 0,
    };

    for (const row of roomsByStatusRows) {
      roomStatusCounts[row.status] = Number(row.count);
    }

    const occupancyRate =
      totalRooms === 0
        ? 0
        : Number(
            (roomStatusCounts[RoomStatus.OCCUPIED] / totalRooms).toFixed(2),
          );

    const dashboardReservationIds = [
      ...new Set(
        [...arrivals, ...departures, ...inHouse].map(
          (reservation) => reservation.id,
        ),
      ),
    ];
    const dashboardGuestIds = [
      ...new Set(
        [...arrivals, ...departures, ...inHouse]
          .map((reservation) => reservation.guest?.id)
          .filter((guestId): guestId is string => Boolean(guestId)),
      ),
    ];

    const dashboardRoomIds = [
      ...new Set(
        [...arrivals, ...departures, ...inHouse]
          .map((reservation) => reservation.room?.id)
          .filter((roomId): roomId is string => Boolean(roomId)),
      ),
    ];

    const [
      folios,
      depositRows,
      documentRows,
      activeMaintenanceRows,
      activeMaintenanceCount,
    ] = await Promise.all([
      dashboardReservationIds.length === 0
        ? Promise.resolve([])
        : this.folioRepository.find({
            where: {
              tenant: { id: tenantId },
              reservation: { id: In(dashboardReservationIds) },
            },
            relations: ['reservation'],
          }),
      dashboardReservationIds.length === 0
        ? Promise.resolve([])
        : this.depositRepository
            .createQueryBuilder('deposit')
            .innerJoin('deposit.reservation', 'reservation')
            .select('reservation.id', 'reservationId')
            .addSelect('COALESCE(SUM(deposit.amount), 0)', 'amount')
            .where('deposit.tenantId = :tenantId', { tenantId })
            .andWhere('reservation.id IN (:...reservationIds)', {
              reservationIds: dashboardReservationIds,
            })
            .groupBy('reservation.id')
            .getRawMany<{ reservationId: string; amount: string }>(),
      dashboardGuestIds.length === 0
        ? Promise.resolve([])
        : this.documentRepository
            .createQueryBuilder('document')
            .innerJoin('document.guest', 'guest')
            .select('guest.id', 'guestId')
            .addSelect('COUNT(document.id)::int', 'count')
            .where('document.tenantId = :tenantId', { tenantId })
            .andWhere('guest.id IN (:...guestIds)', {
              guestIds: dashboardGuestIds,
            })
            .andWhere('document.verified = true')
            .groupBy('guest.id')
            .getRawMany<{ guestId: string; count: number }>(),
      dashboardRoomIds.length === 0
        ? Promise.resolve([])
        : this.maintenanceRepository.find({
            where: {
              tenant: { id: tenantId },
              room: { id: In(dashboardRoomIds) },
              status: In([MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS]),
            },
            relations: ['room'],
            order: { createdAt: 'DESC' },
          }),
      this.maintenanceRepository.count({
        where: {
          tenant: { id: tenantId },
          status: In([MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS]),
        },
      }),
    ]);

    const folioByReservationId = new Map(
      folios.map((folio) => [folio.reservation.id, folio]),
    );
    const depositByReservationId = new Map(
      depositRows.map((row) => [row.reservationId, Number(row.amount)]),
    );
    const documentCountByGuestId = new Map(
      documentRows.map((row) => [row.guestId, Number(row.count)]),
    );
    const maintenanceByRoomId = new Map<string, MaintenanceRequest>();
    for (const request of activeMaintenanceRows) {
      if (!maintenanceByRoomId.has(request.room.id)) {
        maintenanceByRoomId.set(request.room.id, request);
      }
    }
    const maintenanceBlockedArrivals = arrivals.filter(
      (reservation) =>
        reservation.room?.status === RoomStatus.MAINTENANCE ||
        (reservation.room?.id
          ? maintenanceByRoomId.has(reservation.room.id)
          : false),
    ).length;
    const readyArrivals = arrivals.filter((reservation) => {
      const folio = folioByReservationId.get(reservation.id);
      const verifiedDocumentCount = reservation.guest?.id
        ? (documentCountByGuestId.get(reservation.guest.id) ?? 0)
        : 0;
      const hasActiveMaintenance = reservation.room?.id
        ? maintenanceByRoomId.has(reservation.room.id)
        : false;

      return (
        Boolean(reservation.guest) &&
        verifiedDocumentCount > 0 &&
        (folio?.status === FolioStatus.OPEN ||
          folio?.status === FolioStatus.IN_PROGRESS) &&
        reservation.room?.status !== RoomStatus.MAINTENANCE &&
        !hasActiveMaintenance
      );
    }).length;

    return {
      date: businessDate,
      overview: {
        totalRooms,
        occupiedRooms: roomStatusCounts[RoomStatus.OCCUPIED],
        availableRooms: roomStatusCounts[RoomStatus.AVAILABLE],
        maintenanceRooms: roomStatusCounts[RoomStatus.MAINTENANCE],
        occupancyRate,
        arrivalsToday: arrivals.length,
        departuresToday: departures.length,
        inHouseGuests: inHouse.length,
        readyArrivals,
        maintenanceBlockedArrivals,
        activeMaintenanceRequests: activeMaintenanceCount,
      },
      roomsByStatus: roomStatusCounts,
      arrivals: arrivals.map((reservation) =>
        this.serializeReservationCard(
          reservation,
          folioByReservationId,
          depositByReservationId,
          documentCountByGuestId,
          maintenanceByRoomId,
        ),
      ),
      departures: departures.map((reservation) =>
        this.serializeReservationCard(
          reservation,
          folioByReservationId,
          depositByReservationId,
          documentCountByGuestId,
          maintenanceByRoomId,
        ),
      ),
      inHouse: inHouse.map((reservation) =>
        this.serializeReservationCard(
          reservation,
          folioByReservationId,
          depositByReservationId,
          documentCountByGuestId,
          maintenanceByRoomId,
        ),
      ),
    };
  }

  async checkIn(params: {
    tenantId: string;
    dto: CheckinDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, tenant: { id: tenantId } },
      relations: ['room'],
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Reservation must be CONFIRMED to check in',
      );
    }

    if (reservation.room.status === RoomStatus.MAINTENANCE) {
      throw new BadRequestException(
        'Room is under maintenance and cannot be checked in',
      );
    }

    if (reservation.room.status === RoomStatus.OCCUPIED) {
      throw new BadRequestException('Room is already occupied');
    }

    await this.foliosService.ensureFolioForReservation({
      tenantId,
      reservationId: reservation.id,
      user: {
        userId: user.userId,
        role: UserRole.STAFF,
      },
    });

    reservation.status = ReservationStatus.CHECKED_IN;
    await this.reservationRepository.save(reservation);

    reservation.room.status = RoomStatus.OCCUPIED;
    await this.roomRepository.save(reservation.room);

    return reservation;
  }

  async checkOut(params: {
    tenantId: string;
    dto: CheckoutDto;
    user: { userId: string };
  }) {
    const { tenantId, dto } = params;

    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, tenant: { id: tenantId } },
      relations: ['room'],
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Reservation must be CHECKED_IN to check out',
      );
    }

    reservation.status = ReservationStatus.CHECKED_OUT;
    await this.reservationRepository.save(reservation);

    reservation.room.status = RoomStatus.AVAILABLE;
    await this.roomRepository.save(reservation.room);

    await this.foliosService.addRoomNightCharge({
      tenantId,
      reservation,
    });
    await this.foliosService.closeFolioSystemByReservation(
      tenantId,
      reservation.id,
    );

    return reservation;
  }

  async verifyGuestDocument(params: {
    tenantId: string;
    dto: VerifyGuestDocumentDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const guest = await this.guestRepository.findOne({
      where: { id: dto.guestId, tenant: { id: tenantId } },
    });

    if (!guest) throw new NotFoundException('Guest not found');

    const verifier = await this.userRepository.findOne({
      where: { id: user.userId },
    });
    if (!verifier) throw new NotFoundException('User not found');

    const document = this.documentRepository.create({
      tenant,
      guest,
      verifiedBy: verifier,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      expiryDate: dto.expiryDate ?? null,
      verified: true,
      notes: dto.notes ?? null,
    });

    return this.documentRepository.save(document);
  }

  async collectDeposit(params: {
    tenantId: string;
    dto: CollectDepositDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, tenant: { id: tenantId } },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    const collector = await this.userRepository.findOne({
      where: { id: user.userId },
    });
    if (!collector) throw new NotFoundException('User not found');

    const deposit = this.depositRepository.create({
      tenant,
      reservation,
      collectedBy: collector,
      amount: dto.amount,
      currency: dto.currency,
      reference: dto.reference ?? null,
    });

    return this.depositRepository.save(deposit);
  }

  private serializeReservationCard(
    reservation: Reservation,
    folioByReservationId: Map<string, Folio>,
    depositByReservationId: Map<string, number>,
    documentCountByGuestId: Map<string, number>,
    maintenanceByRoomId: Map<string, MaintenanceRequest>,
  ) {
    const folio = folioByReservationId.get(reservation.id);
    const depositAmount = depositByReservationId.get(reservation.id) ?? 0;
    const verifiedDocumentCount = reservation.guest?.id
      ? (documentCountByGuestId.get(reservation.guest.id) ?? 0)
      : 0;
    const activeMaintenance = reservation.room?.id
      ? maintenanceByRoomId.get(reservation.room.id)
      : undefined;
    const roomStatus = reservation.room?.status ?? null;

    return {
      reservationId: reservation.id,
      status: reservation.status,
      guestName: reservation.guestName,
      guestEmail: reservation.guestEmail,
      guestId: reservation.guest?.id ?? null,
      roomId: reservation.room?.id ?? null,
      roomNumber: reservation.room?.roomNumber ?? null,
      roomType: reservation.room?.roomType ?? null,
      roomStatus,
      roomBlockedForMaintenance:
        roomStatus === RoomStatus.MAINTENANCE || Boolean(activeMaintenance),
      activeMaintenanceRequest: activeMaintenance
        ? {
            id: activeMaintenance.id,
            title: activeMaintenance.title,
            status: activeMaintenance.status,
          }
        : null,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      readiness: {
        hasGuestProfile: Boolean(reservation.guest),
        verifiedDocumentCount,
        hasDeposit: depositAmount > 0,
        depositAmount,
        hasFolio: Boolean(folio),
        folioId: folio?.id ?? null,
        folioStatus: folio?.status ?? null,
        hasOpenFolio:
          folio?.status === FolioStatus.OPEN ||
          folio?.status === FolioStatus.IN_PROGRESS,
        roomReady: roomStatus !== RoomStatus.MAINTENANCE && !activeMaintenance,
      },
    };
  }

  private normalizeBusinessDate(date?: string) {
    if (!date) {
      return new Date().toISOString().slice(0, 10);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    return date;
  }
}
