// File Name: guest-document.entity.ts
// Path: src/modules/frontdesk/entities/guest-document.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Guest } from '../../guests/guest.entity';
import { User } from '../../users/user.entity';

@Entity('guest_documents')
export class GuestDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Guest, { nullable: false, onDelete: 'RESTRICT' })
  guest: Guest;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  verifiedBy: User;

  @Column({ type: 'varchar', length: 40 })
  documentType: string;

  @Column({ type: 'varchar', length: 80 })
  documentNumber: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: string | null;

  @Column({ type: 'boolean', default: true })
  verified: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
