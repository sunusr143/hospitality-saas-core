/*
File Name: billing.module.ts
Path: src/modules/billing/billing.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Folio } from './entities/folio.entity';
import { FolioLineItem } from './entities/folio-line-item.entity';
import { Invoice } from './entities/invoice.entity';
import { BillingSettings } from './entities/billing-settings.entity';

import { Tenant } from '../tenants/tenant.entity';
import { Reservation } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';

import { RatePlansModule } from '../rate-plans/rate-plans.module';

import { FoliosController } from './controllers/folios.controller';
import { BillingSettingsController } from './controllers/billing-settings.controller';
import { FoliosService } from './services/folios.service';
import { BillingSettingsService } from './services/billing-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Folio,
      FolioLineItem,
      Invoice,
      BillingSettings,
      Tenant,
      Reservation,
      Room,
      User,
    ]),
    RatePlansModule, // ✅ REQUIRED FOR RatePlansService DI
  ],
  controllers: [FoliosController, BillingSettingsController],
  providers: [FoliosService, BillingSettingsService],
  exports: [FoliosService],
})
export class BillingModule {}
