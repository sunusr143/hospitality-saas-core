// File Name: stock-item.entity.ts
// Path: src/modules/procurement/entities/stock-item.entity.ts

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { Supplier } from './supplier.entity';

@Entity('stock_items')
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'varchar', length: 40 })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitCost: number;

  @Column({ type: 'int', default: 0 })
  reorderLevel: number;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  supplier: Supplier | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
