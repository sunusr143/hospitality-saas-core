// File Name: rate-plan.entity.ts
// Path: src/modules/rate-plans/entities/rate-plan.entity.ts

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
import { RatePlanStatus } from '../enums/rate-plan-status.enum';

@Entity('rate_plans')
@Index(['tenant', 'code'], { unique: true })
export class RatePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'date' })
  validFrom: Date;

  @Column({ type: 'date' })
  validTo: Date;

  @Column({
    type: 'enum',
    enum: RatePlanStatus,
    default: RatePlanStatus.ACTIVE,
  })
  status: RatePlanStatus;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
