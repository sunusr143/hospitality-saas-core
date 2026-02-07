/*
File Name: rate-calendar.entity.ts
Path: src/modules/rms/entities/rate-calendar.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { RatePlan } from '../../rate-plans/entities/rate-plan.entity';

@Entity('rate_calendar')
@Index(['tenant', 'roomType', 'date'], { unique: true })
export class RateCalendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => RatePlan, { nullable: true, onDelete: 'SET NULL' })
  ratePlan: RatePlan | null;

  @Column({ type: 'varchar', length: 80 })
  roomType: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseRate: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
