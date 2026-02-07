/*
File Name: inventory.module.ts
Path: src/modules/inventory/inventory.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { OutOfOrder } from './entities/out-of-order.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OutOfOrder, Tenant, Room, User])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
