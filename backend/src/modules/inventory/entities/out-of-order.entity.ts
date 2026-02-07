/*
File Name: out-of-order.entity.ts
Path: src/modules/inventory/entities/out-of-order.entity.ts
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
import { Room } from '../../rooms/room.entity';
import { User } from '../../users/user.entity';
import { OutOfOrderStatus } from '../enums/out-of-order-status.enum';

@Entity('room_out_of_order')
export class OutOfOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  room: Room;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  reportedBy: User;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({
    type: 'enum',
    enum: OutOfOrderStatus,
    default: OutOfOrderStatus.ACTIVE,
  })
  status: OutOfOrderStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
