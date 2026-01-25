/*
File Name: rooms.module.ts
Path: src/modules/rooms/rooms.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './room.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Tenant])],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
