/**
 * File Name: reservation.entity.ts
 * Path: src/modules/reservations/entities/reservation.entity.ts
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
}

@Entity('reservations')
@Check(`"checkInDate" < "checkOutDate"`)
@Index(['tenant', 'room', 'checkInDate', 'checkOutDate'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  checkInDate: string;

  @Column({ type: 'date' })
  checkOutDate: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'varchar', length: 150 })
  guestName: string;

  @Column({ type: 'varchar', length: 150 })
  guestEmail: string;

  /**
   * Tenant isolation (Hotel)
   */
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @Index()
  tenant: Tenant;

  /**
   * Reserved Room
   */
  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  @Index()
  room: Room;

  /**
   * Staff user who created the reservation
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
