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
import { Folio } from '../billing/entities/folio.entity';
import { RmsModule } from '../rms/rms.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomMoveLog, Reservation, Room, User, Tenant, Folio]),
    RmsModule,
    BillingModule,
  ],
  controllers: [FrontDeskController],
  providers: [FrontDeskService],
})
export class FrontDeskModule {}
