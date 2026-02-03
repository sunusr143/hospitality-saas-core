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
import { Invoice } from '../entities/invoice.entity';
import { Reservation } from '../../reservations/reservation.entity';
import { Tenant } from '../../tenants/tenant.entity';
import { User } from '../../users/user.entity';

import { FolioStatus } from '../enums/folio-status.enum';
import { FolioLineItemType } from '../enums/folio-line-item-type.enum';
import { UserRole } from '../../users/enums/user-role.enum';
import { AddLineItemDto } from '../dto/add-line-item.dto';
import { AddPaymentDto } from '../dto/add-payment.dto';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { BillingSettingsService } from './billing-settings.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

/* >>> USED FOR ROOM-NIGHT AUTO CHARGE */
import { RatePlansService } from '../../rate-plans/rate-plans.service';

@Injectable()
export class FoliosService {
  private readonly logger = new Logger(FoliosService.name);

  constructor(
    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,

    @InjectRepository(FolioLineItem)
    private readonly lineItemRepository: Repository<FolioLineItem>,

    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly ratePlansService: RatePlansService,
    private readonly billingSettingsService: BillingSettingsService,
    private readonly auditLogsService: AuditLogsService,
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

    await this.auditLogsService.log({
      tenantId,
      actorId: creator?.id,
      action: 'FOLIO_CREATED',
      entityType: 'FOLIO',
      entityId: folio.id,
      metadata: {
        reservationId: reservation.id,
        roomId: reservation.room?.id,
      },
    });

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

    if (
      [FolioLineItemType.PAYMENT, FolioLineItemType.TAX_GST].includes(dto.type)
    ) {
      throw new BadRequestException('Use the dedicated endpoints for payments or taxes');
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

    const saved = await this.lineItemRepository.save(lineItem);

    await this.auditLogsService.log({
      tenantId,
      actorId: poster?.id,
      action: 'FOLIO_LINE_ITEM_ADDED',
      entityType: 'FOLIO_LINE_ITEM',
      entityId: saved.id,
      metadata: {
        folioId: folio.id,
        type: saved.type,
        amount: saved.totalAmount,
      },
    });

    return saved;
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

    const saved = await this.folioRepository.save(folio);

    await this.auditLogsService.log({
      tenantId,
      actorId: user.userId,
      action: 'FOLIO_CLOSED',
      entityType: 'FOLIO',
      entityId: folio.id,
    });

    return saved;
  }

  async closeFolioSystemByReservation(tenantId: string, reservationId: string) {
    const folio = await this.folioRepository.findOne({
      where: {
        tenant: { id: tenantId },
        reservation: { id: reservationId },
      },
    });

    if (!folio) {
      return;
    }

    if (folio.status === FolioStatus.CLOSED) {
      return;
    }

    folio.status = FolioStatus.CLOSED;
    folio.closedAt = new Date();

    await this.folioRepository.save(folio);

    await this.auditLogsService.log({
      tenantId,
      action: 'FOLIO_CLOSED_SYSTEM',
      entityType: 'FOLIO',
      entityId: folio.id,
    });
  }

  /* ======================================================
     ROOM-NIGHT AUTO CHARGE (SAFE, ADDITIVE, SYSTEM)
     ====================================================== */
  async addRoomNightCharge(params: {
    tenantId: string;
    reservation: Reservation;
  }) {
    const { tenantId, reservation } = params;

    const folio = await this.folioRepository.findOne({
      where: {
        tenant: { id: tenantId },
        reservation: { id: reservation.id },
      },
      relations: ['tenant'],
    });

    if (!folio) {
      throw new NotFoundException('Folio not found for reservation');
    }

    if (folio.status === FolioStatus.CLOSED) {
      return;
    }

    const existing = await this.lineItemRepository.findOne({
      where: {
        folio: { id: folio.id },
        type: FolioLineItemType.ROOM_CHARGE,
      },
    });

    if (existing) {
      return;
    }

    const nights =
      (new Date(reservation.checkOutDate).getTime() -
        new Date(reservation.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (nights <= 0) {
      throw new BadRequestException('Invalid stay duration');
    }

    const ratePlan =
      await this.ratePlansService.findLatestActiveForTenant(tenantId);

    const lineItem = this.lineItemRepository.create({
      type: FolioLineItemType.ROOM_CHARGE,
      description: `Room charges (${nights} nights @ ${ratePlan.basePrice})`,
      quantity: nights,
      unitPrice: ratePlan.basePrice,
      totalAmount: Number(ratePlan.basePrice) * nights,
      currency: folio.currency,
      tenant: folio.tenant,
      folio,
      postedBy: null, // SYSTEM
    });

    let saved: FolioLineItem | null = null;
    try {
      await this.lineItemRepository.save(lineItem);
      saved = lineItem;
    } catch (error: any) {
      if (error?.code === '23505') {
        // Unique constraint hit (already added by another concurrent call)
        return;
      }
      throw error;
    }

    if (saved) {
      await this.auditLogsService.log({
        tenantId,
        action: 'ROOM_NIGHT_CHARGE_POSTED',
        entityType: 'FOLIO_LINE_ITEM',
        entityId: saved.id,
        metadata: {
          folioId: folio.id,
          reservationId: reservation.id,
          nights,
          unitPrice: ratePlan.basePrice,
        },
      });
    }
  }

  async addPayment(params: {
    tenantId: string;
    folioId: string;
    dto: AddPaymentDto;
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
      throw new BadRequestException('Cannot add payments to closed folio');
    }

    if (dto.reference) {
      const existing = await this.lineItemRepository.findOne({
        where: {
          folio: { id: folio.id },
          type: FolioLineItemType.PAYMENT,
          paymentReference: dto.reference,
        },
      });

      if (existing) {
        throw new ConflictException('Duplicate payment reference');
      }
    }

    const poster = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    const amount = Number(dto.amount);
    const totalAmount = -Math.abs(amount);

    const lineItem = this.lineItemRepository.create({
      type: FolioLineItemType.PAYMENT,
      description: `Payment via ${dto.method}`,
      quantity: 1,
      unitPrice: totalAmount,
      totalAmount,
      currency: folio.currency,
      tenant: folio.tenant,
      folio,
      postedBy: poster ?? null,
      paymentMethod: dto.method,
      paymentReference: dto.reference ?? null,
    });

    try {
      const saved = await this.lineItemRepository.save(lineItem);

      await this.auditLogsService.log({
        tenantId,
        actorId: poster?.id,
        action: 'PAYMENT_POSTED',
        entityType: 'FOLIO_LINE_ITEM',
        entityId: saved.id,
        metadata: {
          folioId: folio.id,
          amount: saved.totalAmount,
          method: dto.method,
          reference: dto.reference ?? null,
        },
      });

      return saved;
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Duplicate payment reference');
      }
      throw error;
    }
  }

  async getInvoiceForFolio(tenantId: string, folioId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { tenant: { id: tenantId }, folio: { id: folioId } },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getFolioSummary(tenantId: string, folioId: string) {
    const folio = await this.folioRepository.findOne({
      where: { id: folioId, tenant: { id: tenantId } },
      relations: ['lineItems'],
    });

    if (!folio) {
      throw new NotFoundException('Folio not found');
    }

    const subtotal = this.roundTo2(
      folio.lineItems.reduce((sum, item) => {
        if (
          item.type === FolioLineItemType.PAYMENT ||
          item.type === FolioLineItemType.TAX_GST
        ) {
          return sum;
        }

        const amount = Number(item.totalAmount);
        if (item.type === FolioLineItemType.DISCOUNT) {
          return sum - Math.abs(amount);
        }

        return sum + amount;
      }, 0),
    );

    const tax = this.roundTo2(
      folio.lineItems.reduce((sum, item) => {
        if (item.type !== FolioLineItemType.TAX_GST) {
          return sum;
        }
        return sum + Number(item.totalAmount);
      }, 0),
    );

    const payments = this.roundTo2(
      folio.lineItems.reduce((sum, item) => {
        if (item.type !== FolioLineItemType.PAYMENT) {
          return sum;
        }
        return sum + Number(item.totalAmount);
      }, 0),
    );

    const total = this.roundTo2(subtotal + tax);
    const balanceDue = this.roundTo2(total + payments);

    return {
      folioId: folio.id,
      currency: folio.currency,
      subtotal,
      tax,
      payments,
      total,
      balanceDue,
      status: folio.status,
    };
  }

  async generateInvoiceForFolio(params: {
    tenantId: string;
    folioId: string;
    dto: CreateInvoiceDto;
    user: { userId: string; role: UserRole };
  }) {
    const { tenantId, folioId, dto } = params;
    const gstRate = Number(
      dto.gstRate ?? (await this.billingSettingsService.getGstRate(tenantId)),
    );

    const folio = await this.folioRepository.findOne({
      where: { id: folioId, tenant: { id: tenantId } },
      relations: ['tenant', 'reservation', 'lineItems'],
    });

    if (!folio) {
      throw new NotFoundException('Folio not found');
    }

    if (folio.status !== FolioStatus.CLOSED) {
      throw new BadRequestException('Folio must be closed before invoicing');
    }

    const existing = await this.invoiceRepository.findOne({
      where: { tenant: { id: tenantId }, folio: { id: folioId } },
    });

    if (existing) {
      return existing;
    }

    const subtotal = this.roundTo2(
      folio.lineItems.reduce((sum, item) => {
        if (
          item.type === FolioLineItemType.PAYMENT ||
          item.type === FolioLineItemType.TAX_GST
        ) {
          return sum;
        }

        const amount = Number(item.totalAmount);
        if (item.type === FolioLineItemType.DISCOUNT) {
          return sum - Math.abs(amount);
        }

        return sum + amount;
      }, 0),
    );

    const taxAmount = this.roundTo2(subtotal * gstRate);
    const total = this.roundTo2(subtotal + taxAmount);

    if (gstRate > 0) {
      const taxExists = folio.lineItems.some(
        (item) => item.type === FolioLineItemType.TAX_GST,
      );

      if (!taxExists) {
        const taxLineItem = this.lineItemRepository.create({
          type: FolioLineItemType.TAX_GST,
          description: `GST (${(gstRate * 100).toFixed(2)}%)`,
          quantity: 1,
          unitPrice: taxAmount,
          totalAmount: taxAmount,
          currency: folio.currency,
          tenant: folio.tenant,
          folio,
          postedBy: null,
        });

        try {
          await this.lineItemRepository.save(taxLineItem);
        } catch (error: any) {
          if (error?.code === '23505') {
            // Another concurrent invoice generation already added GST
          } else {
            throw error;
          }
        }
      }
    }

    const invoice = this.invoiceRepository.create({
      invoiceNumber: this.generateInvoiceNumber(),
      tenant: folio.tenant,
      folio,
      reservation: folio.reservation,
      currency: folio.currency,
      subtotal,
      taxRate: gstRate,
      taxAmount,
      total,
      lineItemsSnapshot: folio.lineItems.map((item) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalAmount: Number(item.totalAmount),
        currency: item.currency,
        paymentMethod: item.paymentMethod ?? null,
        paymentReference: item.paymentReference ?? null,
        postedAt: item.postedAt ?? null,
      })),
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date(),
    });

    const saved = await this.invoiceRepository.save(invoice);

    await this.auditLogsService.log({
      tenantId,
      actorId: params.user.userId,
      action: 'INVOICE_ISSUED',
      entityType: 'INVOICE',
      entityId: saved.id,
      metadata: {
        folioId: folio.id,
        invoiceNumber: saved.invoiceNumber,
        total: saved.total,
      },
    });

    return saved;
  }

  async getInvoicePdfStub(tenantId: string, folioId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { tenant: { id: tenantId }, folio: { id: folioId } },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const content = [
      `INVOICE ${invoice.invoiceNumber}`,
      `Status: ${invoice.status}`,
      `Issued: ${invoice.issuedAt.toISOString()}`,
      `Subtotal: ${invoice.subtotal}`,
      `Tax: ${invoice.taxAmount}`,
      `Total: ${invoice.total}`,
      '',
      'This is a placeholder PDF stub.',
    ].join('\n');

    return Buffer.from(content, 'utf-8');
  }

  private generateInvoiceNumber(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `INV-${datePart}-${rand}`;
  }

  private roundTo2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}

/* >>> EXPLICIT EXPORT (fixes TS2305 cache issue) */
