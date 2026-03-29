// File Name: tenant.entity.ts
// Path: backend/src/modules/tenants/tenant.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('tenants')
export class Tenant {
  static readonly DEFAULT_ENABLED_MODULES = [
    'dashboard',
    'property',
    'users',
    'frontdesk',
    'reservations',
    'rooms',
    'guests',
    'restaurant',
    'bar',
    'housekeeping',
    'maintenance',
    'operations',
    'finance',
    'accounting',
    'billing',
    'reports',
    'imports',
  ];

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ default: 'Hospitality' })
  softwareName: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  addressLine1: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currencyCode: string;

  @Column({ type: 'varchar', length: 80, default: 'Asia/Kolkata' })
  timezone: string;

  @Column({ type: 'varchar', length: 5, default: '14:00' })
  checkInTime: string;

  @Column({ type: 'varchar', length: 5, default: '11:00' })
  checkOutTime: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '["dashboard","property","users","frontdesk","reservations","rooms","guests","restaurant","bar","housekeeping","maintenance","operations","finance","accounting","billing","reports","imports"]',
  })
  enabledModules: string[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
