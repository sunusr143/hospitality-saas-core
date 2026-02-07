// File Name: laundry.module.ts
// Path: src/modules/laundry/laundry.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LaundryService } from './laundry.service';
import { LaundryController } from './laundry.controller';
import { LaundryOrder } from './entities/laundry-order.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LaundryOrder, Tenant, Guest])],
  controllers: [LaundryController],
  providers: [LaundryService],
})
export class LaundryModule {}
