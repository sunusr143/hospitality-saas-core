/*
File Name: payments.module.ts
Path: src/modules/payments/payments.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentReconciliation } from './entities/payment-reconciliation.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction, PaymentReconciliation, Tenant, User, Folio])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
