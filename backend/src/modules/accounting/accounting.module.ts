/*
File Name: accounting.module.ts
Path: src/modules/accounting/accounting.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { TaxRate } from './entities/tax-rate.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaxRate, LedgerEntry, Tenant, User, Folio])],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
