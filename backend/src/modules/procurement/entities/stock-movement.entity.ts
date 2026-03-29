import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { StockItem } from './stock-item.entity';

export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  ISSUE = 'ISSUE',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => StockItem, { nullable: false, onDelete: 'CASCADE' })
  stockItem: StockItem;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
