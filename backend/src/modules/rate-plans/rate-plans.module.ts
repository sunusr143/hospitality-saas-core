// File Name: rate-plans.module.ts
// Path: src/modules/rate-plans/rate-plans.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlansService } from './rate-plans.service';
import { RatePlansController } from './rate-plans.controller';
import { RatePlan } from './entities/rate-plan.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlan, Tenant])],
  controllers: [RatePlansController],
  providers: [RatePlansService],
  exports: [RatePlansService],
})
export class RatePlansModule {}
