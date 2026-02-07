/*
File Name: guest.entity.ts
Path: src/modules/guests/guest.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

@Entity('guests')
@Index(['tenant', 'email'], { unique: true })
@Index(['tenant', 'phone'])
export class Guest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  createdBy: User;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nationality: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  idType: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  idNumber: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  addressLine1: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  addressLine2: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  country: string | null;

  @Column({ type: 'boolean', default: false })
  vip: boolean;

  @Column({ type: 'boolean', default: false })
  marketingOptIn: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
