/*
File Name: restriction.entity.ts
Path: src/modules/rms/entities/restriction.entity.ts
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

@Entity('restriction_calendar')
@Index(['tenant', 'roomType', 'date'], { unique: true })
export class Restriction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 80 })
  roomType: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', default: 1 })
  minStay: number;

  @Column({ type: 'int', nullable: true })
  maxStay: number | null;

  @Column({ type: 'boolean', default: false })
  closedToArrival: boolean;

  @Column({ type: 'boolean', default: false })
  closedToDeparture: boolean;

  @Column({ type: 'boolean', default: false })
  closed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
