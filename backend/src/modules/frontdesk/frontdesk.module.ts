// File Name: frontdesk.module.ts
// Path: src/modules/frontdesk/frontdesk.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FrontdeskService } from './frontdesk.service';
import { FrontdeskController } from './frontdesk.controller';
import { Reservation } from '../reservations/reservation.entity';
import { Room } from '../rooms/room.entity';
import { User } from '../users/user.entity';
import { Guest } from '../guests/guest.entity';
import { Tenant } from '../tenants/tenant.entity';
import { GuestDocument } from './entities/guest-document.entity';
import { Deposit } from './entities/deposit.entity';
import { BillingModule } from '../billing/billing.module';
import { Folio } from '../billing/entities/folio.entity';
import { MaintenanceRequest } from '../maintenance/entities/maintenance-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Room,
      User,
      Guest,
      Tenant,
      GuestDocument,
      Deposit,
      Folio,
      MaintenanceRequest,
    ]),
    BillingModule,
  ],
  controllers: [FrontdeskController],
  providers: [FrontdeskService],
})
export class FrontdeskModule {}
