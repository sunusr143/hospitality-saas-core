/*
File Name: ledger-entry.entity.ts
Path: src/modules/accounting/entities/ledger-entry.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { Folio } from '../../billing/entities/folio.entity';
import { User } from '../../users/user.entity';
import { LedgerEntryType } from '../enums/ledger-entry-type.enum';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Folio, { nullable: true, onDelete: 'SET NULL' })
  folio: Folio | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  createdBy: User | null;

  @Column({
    type: 'enum',
    enum: LedgerEntryType,
  })
  type: LedgerEntryType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
