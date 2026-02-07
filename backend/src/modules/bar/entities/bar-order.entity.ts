/*
File Name: bar-order.entity.ts
Path: src/modules/bar/entities/bar-order.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { User } from '../../users/user.entity';
import { Folio } from '../../billing/entities/folio.entity';
import { BarOrderStatus } from '../enums/bar-order-status.enum';

@Entity('bar_orders')
export class BarOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  createdBy: User;

  @ManyToOne(() => Folio, { nullable: true, onDelete: 'SET NULL' })
  folio: Folio | null;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: BarOrderStatus,
    default: BarOrderStatus.OPEN,
  })
  status: BarOrderStatus;

  @Column({ type: 'timestamptz', nullable: true })
  postedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
