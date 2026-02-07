// File Name: laundry-order.entity.ts
// Path: src/modules/laundry/entities/laundry-order.entity.ts

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { Guest } from '../../guests/guest.entity';

@Entity('laundry_orders')
export class LaundryOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Guest, { nullable: false, onDelete: 'RESTRICT' })
  guest: Guest;

  @Column({ type: 'varchar', length: 160 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
