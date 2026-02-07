/*
File Name: front-desk.module.ts
Path: src/modules/front-desk/front-desk.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FrontDeskService } from './front-desk.service';
import { FrontDeskController } from './front-desk.controller';
import { RoomMoveLog } from './entities/room-move-log.entity';
import { Reservation } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomMoveLog, Reservation, Room, User, Tenant])],
  controllers: [FrontDeskController],
  providers: [FrontDeskService],
})
export class FrontDeskModule {}
