/*
File Name: bar-order-item.entity.ts
Path: src/modules/bar/entities/bar-order-item.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BarOrder } from './bar-order.entity';
import { BarItem } from './bar-item.entity';

@Entity('bar_order_items')
export class BarOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BarOrder, { nullable: false, onDelete: 'CASCADE' })
  order: BarOrder;

  @ManyToOne(() => BarItem, { nullable: false, onDelete: 'RESTRICT' })
  item: BarItem;

  @Column({ type: 'varchar', length: 150 })
  nameSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
