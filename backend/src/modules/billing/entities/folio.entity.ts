/*
File Name: folio.entity.ts
Path: src/modules/billing/entities/folio.entity.ts
*/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Reservation } from '../../reservations/reservation.entity';
import { Room } from '../../rooms/room.entity';
import { User } from '../../users/user.entity';
import { FolioStatus } from '../enums/folio-status.enum';
import { FolioLineItem } from './folio-line-item.entity';

@Entity('folios')
@Index(['tenant', 'reservation'], { unique: true })
export class Folio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  guestNameSnapshot: string;

  @Column({ length: 10 })
  currency: string;

  @Column({
    type: 'enum',
    enum: FolioStatus,
    default: FolioStatus.OPEN,
  })
  status: FolioStatus;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Reservation, { nullable: false, onDelete: 'RESTRICT' })
  reservation: Reservation;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'RESTRICT' })
  room: Room;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  createdBy: User;

  @OneToMany(() => FolioLineItem, (item) => item.folio)
  lineItems: FolioLineItem[];

  @Column({ type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
