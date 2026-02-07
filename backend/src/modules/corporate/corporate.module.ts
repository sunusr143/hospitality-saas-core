/*
File Name: corporate.module.ts
Path: src/modules/corporate/corporate.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CorporateService } from './corporate.service';
import { CorporateController } from './corporate.controller';
import { CorporateAccount } from './entities/corporate-account.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateAccount, Tenant])],
  controllers: [CorporateController],
  providers: [CorporateService],
})
export class CorporateModule {}
