/*
File Name: reports.module.ts
Path: src/modules/reports/reports.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Reservation } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { FolioLineItem } from '../billing/entities/folio-line-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Room, FolioLineItem]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
