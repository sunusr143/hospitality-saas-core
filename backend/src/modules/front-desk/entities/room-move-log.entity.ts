/*
File Name: room-move-log.entity.ts
Path: src/modules/front-desk/entities/room-move-log.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Reservation } from '../../reservations/reservation.entity';
import { Room } from '../../rooms/room.entity';
import { User } from '../../users/user.entity';

@Entity('room_move_logs')
export class RoomMoveLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Reservation, { nullable: false, onDelete: 'RESTRICT' })
  reservation: Reservation;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  fromRoom: Room;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  toRoom: Room;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  movedBy: User;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  movedAt: Date;
}
