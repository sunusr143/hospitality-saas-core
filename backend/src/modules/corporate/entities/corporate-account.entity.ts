/*
File Name: corporate-account.entity.ts
Path: src/modules/corporate/entities/corporate-account.entity.ts
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

import { Tenant } from '../../tenants/tenant.entity';

@Entity('corporate_accounts')
@Index(['tenant', 'name'], { unique: true })
export class CorporateAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  billingAddress: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
