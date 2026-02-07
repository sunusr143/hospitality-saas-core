// File Name: supplier.entity.ts
// Path: src/modules/procurement/entities/supplier.entity.ts

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  contactEmail: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
