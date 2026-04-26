/*
File Name: rms.module.ts
Path: src/modules/rms/rms.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RmsService } from './rms.service';
import { RmsController } from './rms.controller';
import { RateCalendar } from './entities/rate-calendar.entity';
import { Availability } from './entities/availability.entity';
import { Restriction } from './entities/restriction.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RatePlan } from '../rate-plans/entities/rate-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RateCalendar, Availability, Restriction, Tenant, RatePlan])],
  controllers: [RmsController],
  providers: [RmsService],
  exports: [RmsService],
})
export class RmsModule {}
