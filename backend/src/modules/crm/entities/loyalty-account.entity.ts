// File Name: loyalty-account.entity.ts
// Path: src/modules/crm/entities/loyalty-account.entity.ts

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { Guest } from '../../guests/guest.entity';

@Entity('loyalty_accounts')
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Guest, { nullable: false, onDelete: 'RESTRICT' })
  guest: Guest;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'varchar', length: 40, default: 'BASIC' })
  tier: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
