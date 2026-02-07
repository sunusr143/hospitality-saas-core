/*
File Name: maintenance-request.entity.ts
Path: src/modules/maintenance/entities/maintenance-request.entity.ts
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
import { MaintenanceStatus } from '../enums/maintenance-status.enum';

@Entity('maintenance_requests')
export class MaintenanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  room: Room;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  reportedBy: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assignedTo: User | null;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.OPEN,
  })
  status: MaintenanceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
