// File Name: shift.entity.ts
// Path: src/modules/hr/entities/shift.entity.ts

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { User } from '../../users/user.entity';

@Entity('staff_shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  staff: User;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
