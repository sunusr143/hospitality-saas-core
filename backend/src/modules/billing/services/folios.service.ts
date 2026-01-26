/*
File Name: folios.service.ts
Path: src/modules/billing/services/folios.service.ts
*/

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Folio } from '../entities/folio.entity';
import { FolioLineItem } from '../entities/folio-line-item.entity';
import { Reservation } from '../../reservations/reservation.entity';
import { Tenant } from '../../tenants/tenant.entity';
import { User } from '../../users/user.entity';

import { FolioStatus } from '../enums/folio-status.enum';
import { FolioLineItemType } from '../enums/folio-line-item-type.enum';
import { UserRole } from '../../users/enums/user-role.enum';
import { AddLineItemDto } from '../dto/add-line-item.dto';

@Injectable()
export class FoliosService {
  private readonly logger = new Logger(FoliosService.name);

  constructor(
    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,

    @InjectRepository(FolioLineItem)
    private readonly lineItemRepository: Repository<FolioLineItem>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * ADMIN — manual folio creation
   */
  async createFolio(params: {
    tenantId: string;
    reservationId: string;
    user: { userId: string; role: UserRole };
  }) {
    const { tenantId, reservationId, user } = params;

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create folio');
    }

    const reservation = await this.reservationRepository.findOne({
      where: {
        id: reservationId,
        tenant: { id: tenantId },
      },
      relations: ['tenant', 'room'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const existing = await this.folioRepository.findOne({
      where: {
        tenant: { id: tenantId },
        reservation: { id: reservationId },
      },
    });

    if (existing) {
      throw new ConflictException('Folio already exists for reservation');
    }

    const creator = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    const folio = this.folioRepository.create({
      tenant: reservation.tenant,
      reservation,
      room: reservation.room,
      guestNameSnapshot: reservation.guestName,
      currency: 'INR',
      status: FolioStatus.OPEN,
      openedAt: new Date(),
      createdBy: creator!,
    });

    this.logger.log(`Folio created for reservation ${reservation.id}`);

    return this.folioRepository.save(folio);
  }

  async getFolioForReservation(tenantId: string, reservationId: string) {
    const folio = await this.folioRepository.findOne({
      where: {
        tenant: { id: tenantId },
        reservation: { id: reservationId },
      },
      relations: ['lineItems', 'reservation', 'room'],
    });

    if (!folio) {
      throw new NotFoundException('Folio not found');
    }

    return folio;
  }

  async addLineItem(params: {
    tenantId: string;
    folioId: string;
    dto: AddLineItemDto;
    user: { userId: string; role: UserRole };
  }) {
    const { tenantId, folioId, dto, user } = params;

    const folio = await this.folioRepository.findOne({
      where: { id: folioId, tenant: { id: tenantId } },
      relations: ['tenant'],
    });

    if (!folio) {
      throw new NotFoundException('Folio not found');
    }

    if (folio.status === FolioStatus.CLOSED) {
      throw new BadRequestException('Cannot add items to closed folio');
    }

    if (
      [FolioLineItemType.ADJUSTMENT, FolioLineItemType.DISCOUNT].includes(dto.type) &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only ADMIN can add adjustments or discounts');
    }

    const poster = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    const totalAmount = Number(dto.quantity) * Number(dto.unitPrice);

    const lineItem = this.lineItemRepository.create({
      type: dto.type,
      description: dto.description,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      totalAmount,
      currency: dto.currency,
      relatedEntityType: dto.relatedEntityType ?? null,
      relatedEntityId: dto.relatedEntityId ?? null,
      tenant: folio.tenant,
      folio,
      postedBy: poster ?? null,
    });

    return this.lineItemRepository.save(lineItem);
  }

  async closeFolio(
    tenantId: string,
    folioId: string,
    user: { userId: string; role: UserRole },
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can close folio');
    }

    const folio = await this.folioRepository.findOne({
      where: { id: folioId, tenant: { id: tenantId } },
      relations: ['reservation'],
    });

    if (!folio) {
      throw new NotFoundException('Folio not found');
    }

    if (folio.status === FolioStatus.CLOSED) {
      throw new BadRequestException('Folio already closed');
    }

    folio.status = FolioStatus.CLOSED;
    folio.closedAt = new Date();

    return this.folioRepository.save(folio);
  }
}
