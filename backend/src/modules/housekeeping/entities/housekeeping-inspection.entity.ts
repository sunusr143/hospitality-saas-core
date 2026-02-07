// File Name: housekeeping-inspection.entity.ts
// Path: src/modules/housekeeping/entities/housekeeping-inspection.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Room } from '../../rooms/room.entity';
import { User } from '../../users/user.entity';

@Entity('housekeeping_inspections')
export class HousekeepingInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  room: Room;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  inspector: User;

  @Column({ type: 'boolean', default: true })
  passed: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
