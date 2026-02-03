/*
File Name: invoice.entity.ts
Path: src/modules/billing/entities/invoice.entity.ts
*/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Folio } from './folio.entity';
import { Reservation } from '../../reservations/reservation.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';

@Entity('invoices')
@Index(['tenant', 'folio'], { unique: true })
@Index(['tenant', 'invoiceNumber'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30 })
  invoiceNumber: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Folio, { nullable: false, onDelete: 'RESTRICT' })
  folio: Folio;

  @ManyToOne(() => Reservation, { nullable: false, onDelete: 'RESTRICT' })
  reservation: Reservation;

  @Column({ length: 10 })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'jsonb' })
  lineItemsSnapshot: Array<{
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    currency: string;
    paymentMethod?: string | null;
    paymentReference?: string | null;
    postedAt?: Date | string | null;
  }>;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.ISSUED,
  })
  status: InvoiceStatus;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
