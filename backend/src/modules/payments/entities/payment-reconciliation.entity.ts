// File Name: payment-reconciliation.entity.ts
// Path: src/modules/payments/entities/payment-reconciliation.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { PaymentTransaction } from './payment-transaction.entity';
import { User } from '../../users/user.entity';

@Entity('payment_reconciliations')
export class PaymentReconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => PaymentTransaction, { nullable: false, onDelete: 'RESTRICT' })
  transaction: PaymentTransaction;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  reconciledBy: User;

  @Column({ type: 'varchar', length: 120 })
  reconciliationReference: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
