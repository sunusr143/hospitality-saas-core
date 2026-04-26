// File Name: user.entity.ts
// Path: backend/src/modules/users/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { UserRole } from './enums/user-role.enum';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  superUserRecoveryQuestionOne: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  superUserRecoveryQuestionTwo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  superUserRecoveryAnswerHashOne: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  superUserRecoveryAnswerHashTwo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  superUserRecoveryKeyHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  superUserRecoveryConfiguredAt: Date | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  department: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  addressLine1: string | null;

  @Column({ type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
