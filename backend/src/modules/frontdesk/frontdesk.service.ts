// File Name: frontdesk.service.ts
// Path: src/modules/frontdesk/frontdesk.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { Guest } from '../guests/guest.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RoomStatus } from '../rooms/enums/room-status.enum';
import { FoliosService } from '../billing/services/folios.service';

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

    private readonly foliosService: FoliosService,
  ) {}

  async checkIn(params: { tenantId: string; dto: CheckinDto; user: { userId: string } }) {
    const { tenantId, dto, user } = params;

    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, tenant: { id: tenantId } },
      relations: ['room'],
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Reservation must be CONFIRMED to check in');
    }

    reservation.status = ReservationStatus.CHECKED_IN;
    await this.reservationRepository.save(reservation);

    reservation.room.status = RoomStatus.OCCUPIED;
    await this.roomRepository.save(reservation.room);

    return reservation;
  }

  async checkOut(params: { tenantId: string; dto: CheckoutDto; user: { userId: string } }) {
    const { tenantId, dto } = params;

    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, tenant: { id: tenantId } },
      relations: ['room'],
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new BadRequestException('Reservation must be CHECKED_IN to check out');
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

  async verifyGuestDocument(params: { tenantId: string; dto: VerifyGuestDocumentDto; user: { userId: string } }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const guest = await this.guestRepository.findOne({
      where: { id: dto.guestId, tenant: { id: tenantId } },
    });

    if (!guest) throw new NotFoundException('Guest not found');

    const verifier = await this.userRepository.findOne({ where: { id: user.userId } });
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

  async collectDeposit(params: { tenantId: string; dto: CollectDepositDto; user: { userId: string } }) {
    const { tenantId, dto, user } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, tenant: { id: tenantId } },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    const collector = await this.userRepository.findOne({ where: { id: user.userId } });
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
}
