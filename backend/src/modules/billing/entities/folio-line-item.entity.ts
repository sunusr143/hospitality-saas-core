/*
File Name: folio-line-item.entity.ts
Path: src/modules/billing/entities/folio-line-item.entity.ts
*/

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Folio } from './folio.entity';
import { User } from '../../users/user.entity';
import { FolioLineItemType } from '../enums/folio-line-item-type.enum';

@Entity('folio_line_items')
@Index(['tenant', 'folio'])
export class FolioLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FolioLineItemType,
  })
  type: FolioLineItemType;

  @Column({ length: 255 })
  description: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedEntityType: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId: string | null;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Folio, (folio) => folio.lineItems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  folio: Folio;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  postedBy: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  postedAt: Date;
}
