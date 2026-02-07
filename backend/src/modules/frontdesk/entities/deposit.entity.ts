// File Name: deposit.entity.ts
// Path: src/modules/frontdesk/entities/deposit.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Reservation } from '../../reservations/reservation.entity';
import { User } from '../../users/user.entity';

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Reservation, { nullable: false, onDelete: 'RESTRICT' })
  reservation: Reservation;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  collectedBy: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
