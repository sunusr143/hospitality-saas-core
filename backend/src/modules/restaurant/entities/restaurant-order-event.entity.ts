import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RestaurantOrder } from './restaurant-order.entity';
import { Tenant } from '../../tenants/tenant.entity';
import { User } from '../../users/user.entity';

@Entity('restaurant_order_events')
export class RestaurantOrderEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => RestaurantOrder, { nullable: false, onDelete: 'CASCADE' })
  order: RestaurantOrder;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  actor: User | null;

  @Column({ type: 'varchar', length: 40 })
  eventType: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
