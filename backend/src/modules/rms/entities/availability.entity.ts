/*
File Name: availability.entity.ts
Path: src/modules/rms/entities/availability.entity.ts
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

@Entity('availability_calendar')
@Index(['tenant', 'roomType', 'date'], { unique: true })
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 80 })
  roomType: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int' })
  totalRooms: number;

  @Column({ type: 'int' })
  availableRooms: number;

  @Column({ type: 'boolean', default: false })
  stopSell: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
