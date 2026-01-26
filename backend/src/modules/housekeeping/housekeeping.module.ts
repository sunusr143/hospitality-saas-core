// File Name: housekeeping.module.ts
// Path: src/modules/housekeeping/housekeeping.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousekeepingService } from './housekeeping.service';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingTask } from './entities/housekeeping-task.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HousekeepingTask, Tenant, Room])],
  controllers: [HousekeepingController],
  providers: [HousekeepingService],
})
export class HousekeepingModule {}
