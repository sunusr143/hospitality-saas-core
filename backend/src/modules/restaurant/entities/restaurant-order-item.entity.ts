/*
File Name: restaurant-order-item.entity.ts
Path: src/modules/restaurant/entities/restaurant-order-item.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RestaurantOrder } from './restaurant-order.entity';
import { RestaurantItem } from './restaurant-item.entity';

@Entity('restaurant_order_items')
export class RestaurantOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RestaurantOrder, { nullable: false, onDelete: 'CASCADE' })
  order: RestaurantOrder;

  @ManyToOne(() => RestaurantItem, { nullable: false, onDelete: 'RESTRICT' })
  item: RestaurantItem;

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
