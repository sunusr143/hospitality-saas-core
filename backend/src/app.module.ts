// File Name: app.module.ts
// Path: backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { RatePlansModule } from './modules/rate-plans/rate-plans.module';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { BillingModule } from './modules/billing/billing.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    TenantsModule,
    UsersModule,
    AuthModule,
    RoomsModule,
    ReservationsModule,
    RatePlansModule,
    HousekeepingModule,
    BillingModule,


  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
