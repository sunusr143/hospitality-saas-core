/*
File Name: room.entity.ts
Path: src/modules/rooms/room.entity.ts
*/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { RoomStatus } from './enums/room-status.enum';

@Entity('rooms')
@Unique(['tenant', 'roomNumber'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomNumber: string;

  @Column()
  roomType: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
