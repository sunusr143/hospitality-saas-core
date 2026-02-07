/*
File Name: maintenance.module.ts
Path: src/modules/maintenance/maintenance.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRequest, Tenant, Room, User])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
