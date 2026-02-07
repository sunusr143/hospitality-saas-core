// File Name: housekeeping-task.entity.ts
// Path: src/modules/housekeeping/entities/housekeeping-task.entity.ts

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
import { HousekeepingStatus } from '../enums/housekeeping-status.enum';
import { HousekeepingPriority } from '../enums/housekeeping-priority.enum';

@Entity('housekeeping_tasks')
export class HousekeepingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  room: Room;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assignedTo: User | null;

  @Column({
    type: 'enum',
    enum: HousekeepingStatus,
    default: HousekeepingStatus.PENDING,
  })
  status: HousekeepingStatus;

  @Column({
    type: 'enum',
    enum: HousekeepingPriority,
    default: HousekeepingPriority.NORMAL,
  })
  priority: HousekeepingPriority;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
