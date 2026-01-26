/*
File Name: billing.module.ts
Path: src/modules/billing/billing.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Folio } from './entities/folio.entity';
import { FolioLineItem } from './entities/folio-line-item.entity';

import { Tenant } from '../tenants/tenant.entity';
import { Reservation } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { RatePlan } from '../rate-plans/entities/rate-plan.entity';

import { FoliosController } from './controllers/folios.controller';
import { FoliosService } from './services/folios.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Folio,
      FolioLineItem,
      Tenant,
      Reservation,
      Room,
      User,
      RatePlan,
    ]),
  ],
  controllers: [FoliosController],
  providers: [FoliosService],
})
export class BillingModule {}
