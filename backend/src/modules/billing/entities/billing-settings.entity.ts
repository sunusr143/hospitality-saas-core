/*
File Name: billing-settings.entity.ts
Path: src/modules/billing/entities/billing-settings.entity.ts
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

@Entity('billing_settings')
@Index(['tenant'], { unique: true })
export class BillingSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  gstRate: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
