// File Name: taxes.module.ts
// Path: src/modules/taxes/taxes.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { TaxRule } from './entities/tax-rule.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaxRule, Tenant])],
  controllers: [TaxesController],
  providers: [TaxesService],
})
export class TaxesModule {}
