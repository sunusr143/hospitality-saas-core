/*
File Name: reports.service.ts
Path: src/modules/reports/reports.service.ts
*/

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { FolioLineItem } from '../billing/entities/folio-line-item.entity';
import { FolioLineItemType } from '../billing/enums/folio-line-item-type.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(FolioLineItem)
    private readonly lineItemRepository: Repository<FolioLineItem>,
  ) {}

  async getKpis(params: { tenantCode: string; from: string; to: string }) {
    const { tenantCode, from, to } = params;

    const fromDate = this.toDateOnly(from);
    const toDate = this.toDateOnly(to);
    if (toDate <= fromDate) {
      throw new BadRequestException('to must be after from');
    }

    const nights = this.diffDays(fromDate, toDate);
    const roomCount = await this.roomRepository.count({
      where: { tenant: { code: tenantCode } },
    });
    const availableRoomNights = roomCount * nights;

    const occupiedNights = await this.getOccupiedNights(
      tenantCode,
      from,
      to,
    );

    const revenue = await this.getRevenueBreakdown(
      tenantCode,
      fromDate,
      toDate,
    );

    const cappedOccupiedNights =
      availableRoomNights === 0
        ? 0
        : Math.min(occupiedNights, availableRoomNights);

    const occupancyRate =
      availableRoomNights === 0
        ? 0
        : this.roundTo2(cappedOccupiedNights / availableRoomNights);

    const adr =
      cappedOccupiedNights === 0
        ? 0
        : this.roundTo2(revenue.roomRevenue / cappedOccupiedNights);

    const revPar =
      availableRoomNights === 0
        ? 0
        : this.roundTo2(revenue.roomRevenue / availableRoomNights);

    return {
      from,
      to,
      roomCount,
      availableRoomNights,
      occupiedNights: cappedOccupiedNights,
      occupancyRate,
      adr,
      revPar,
      revenue,
    };
  }

  async getDailyKpis(params: {
    tenantCode: string;
    from: string;
    to: string;
  }) {
    const { tenantCode, from, to } = params;

    const fromDate = this.toDateOnly(from);
    const toDate = this.toDateOnly(to);
    if (toDate <= fromDate) {
      throw new BadRequestException('to must be after from');
    }

    const roomCount = await this.roomRepository.count({
      where: { tenant: { code: tenantCode } },
    });

    const rows = await this.reservationRepository.query(
      `
      WITH days AS (
        SELECT generate_series($1::date, ($2::date - interval '1 day'), interval '1 day')::date AS day
      ),
      occ AS (
        SELECT
          d.day,
          COALESCE(SUM(
            CASE
              WHEN r."checkInDate" < d.day + interval '1 day'
               AND r."checkOutDate" > d.day
              THEN 1
              ELSE 0
            END
          ), 0) AS occupied
        FROM days d
        LEFT JOIN reservations r
          ON r."tenantId" = (SELECT id FROM tenants WHERE code = $3)
         AND r.status IN ('CONFIRMED','CHECKED_IN','CHECKED_OUT')
        GROUP BY d.day
      )
      SELECT day, occupied
      FROM occ
      ORDER BY day ASC
      `,
      [from, to, tenantCode],
    );

    return rows.map((row: { day: string; occupied: string }) => {
      const occupiedNights = Math.min(Number(row.occupied), roomCount);
      const availableRoomNights = roomCount;
      const occupancyRate =
        availableRoomNights === 0
          ? 0
          : this.roundTo2(occupiedNights / availableRoomNights);

      return {
        date: row.day,
        roomCount,
        availableRoomNights,
        occupiedNights,
        occupancyRate,
      };
    });
  }

  async getRevenueByRoom(params: {
    tenantCode: string;
    from: string;
    to: string;
  }) {
    const { tenantCode, from, to } = params;
    const fromDate = this.toDateOnly(from);
    const toDate = this.toDateOnly(to);
    if (toDate <= fromDate) {
      throw new BadRequestException('to must be after from');
    }

    const fromTs = new Date(fromDate);
    const toTs = new Date(toDate);
    toTs.setDate(toTs.getDate() + 1);

    const rows = await this.lineItemRepository
      .createQueryBuilder('li')
      .innerJoin('li.folio', 'folio')
      .innerJoin('folio.room', 'room')
      .innerJoin('li.tenant', 'tenant')
      .select('room.id', 'roomId')
      .addSelect('room.roomNumber', 'roomNumber')
      .addSelect('room.roomType', 'roomType')
      .addSelect(
        `
        COALESCE(SUM(CASE WHEN li.type = :room THEN li."totalAmount" ELSE 0 END), 0)
        `,
        'roomRevenue',
      )
      .addSelect(
        `
        COALESCE(SUM(CASE WHEN li.type = :tax THEN li."totalAmount" ELSE 0 END), 0)
        `,
        'tax',
      )
      .addSelect(
        `
        COALESCE(SUM(CASE WHEN li.type = :payment THEN li."totalAmount" ELSE 0 END), 0)
        `,
        'payments',
      )
      .where('tenant.code = :tenantCode', { tenantCode })
      .andWhere('li."postedAt" >= :fromTs', { fromTs })
      .andWhere('li."postedAt" < :toTs', { toTs })
      .setParameters({
        room: FolioLineItemType.ROOM_CHARGE,
        tax: FolioLineItemType.TAX_GST,
        payment: FolioLineItemType.PAYMENT,
      })
      .groupBy('room.id')
      .addGroupBy('room.roomNumber')
      .addGroupBy('room.roomType')
      .orderBy('room.roomNumber', 'ASC')
      .getRawMany();

    return rows.map((row: any) => ({
      roomId: row.roomId,
      roomNumber: row.roomNumber,
      roomType: row.roomType,
      roomRevenue: this.roundTo2(Number(row.roomRevenue)),
      tax: this.roundTo2(Number(row.tax)),
      payments: this.roundTo2(Number(row.payments)),
      grossRevenue: this.roundTo2(
        Number(row.roomRevenue) + Number(row.tax),
      ),
    }));
  }

  private async getOccupiedNights(
    tenantCode: string,
    from: string,
    to: string,
  ): Promise<number> {
    const raw = await this.reservationRepository
      .createQueryBuilder('r')
      .innerJoin('r.tenant', 'tenant')
      .select(
        `
        COALESCE(
          SUM(
            GREATEST(
              0,
              LEAST(r."checkOutDate", :to)::date
              - GREATEST(r."checkInDate", :from)::date
            )
          ),
          0
        )
        `,
        'occupied_nights',
      )
      .where('tenant.code = :tenantCode', { tenantCode })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.CONFIRMED,
          ReservationStatus.CHECKED_IN,
          ReservationStatus.CHECKED_OUT,
        ],
      })
      .setParameters({ from, to })
      .getRawOne();

    return Number(raw?.occupied_nights ?? 0);
  }

  private async getRevenueBreakdown(
    tenantCode: string,
    fromDate: Date,
    toDate: Date,
  ) {
    const fromTs = new Date(fromDate);
    const toTs = new Date(toDate);
    toTs.setDate(toTs.getDate() + 1);

    const raw = await this.lineItemRepository
      .createQueryBuilder('li')
      .innerJoin('li.tenant', 'tenant')
      .select(
        `
        COALESCE(SUM(CASE WHEN li.type = :room THEN li."totalAmount" ELSE 0 END), 0)
        `,
        'room_revenue',
      )
      .addSelect(
        `
        COALESCE(SUM(CASE WHEN li.type = :tax THEN li."totalAmount" ELSE 0 END), 0)
        `,
        'tax',
      )
      .addSelect(
        `
        COALESCE(SUM(CASE WHEN li.type = :payment THEN li."totalAmount" ELSE 0 END), 0)
        `,
        'payments',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE
              WHEN li.type NOT IN (:...exclude) THEN li."totalAmount"
              ELSE 0
            END
          ),
          0
        )
        `,
        'net_revenue',
      )
      .where('tenant.code = :tenantCode', { tenantCode })
      .andWhere('li."postedAt" >= :fromTs', { fromTs })
      .andWhere('li."postedAt" < :toTs', { toTs })
      .setParameters({
        room: FolioLineItemType.ROOM_CHARGE,
        tax: FolioLineItemType.TAX_GST,
        payment: FolioLineItemType.PAYMENT,
        exclude: [FolioLineItemType.PAYMENT, FolioLineItemType.TAX_GST],
      })
      .getRawOne();

    const roomRevenue = Number(raw?.room_revenue ?? 0);
    const tax = Number(raw?.tax ?? 0);
    const payments = Number(raw?.payments ?? 0);
    const netRevenue = Number(raw?.net_revenue ?? 0);
    const grossRevenue = this.roundTo2(netRevenue + tax);

    return {
      roomRevenue: this.roundTo2(roomRevenue),
      netRevenue: this.roundTo2(netRevenue),
      tax: this.roundTo2(tax),
      grossRevenue,
      payments: this.roundTo2(payments),
    };
  }

  private toDateOnly(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private diffDays(from: Date, to: Date): number {
    return Math.round((to.getTime() - from.getTime()) / 86400000);
  }

  private roundTo2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
