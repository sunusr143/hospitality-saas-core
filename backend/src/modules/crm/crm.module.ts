// File Name: crm.module.ts
// Path: src/modules/crm/crm.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyAccount, Tenant, Guest])],
  controllers: [CrmController],
  providers: [CrmService],
})
export class CrmModule {}
