/**
 * File Name: reservations.module.ts
 * Path: src/modules/reservations/reservations.module.ts
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

import { Reservation } from './reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Room,
      User,
    ]),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
