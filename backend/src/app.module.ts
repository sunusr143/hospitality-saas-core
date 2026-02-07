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
import { ReportsModule } from './modules/reports/reports.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { GuestsModule } from './modules/guests/guests.module';
import { BarModule } from './modules/bar/bar.module';
import { RmsModule } from './modules/rms/rms.module';
import { FrontDeskModule } from './modules/front-desk/front-desk.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ChannelModule } from './modules/channel/channel.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { CorporateModule } from './modules/corporate/corporate.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FrontdeskModule } from './modules/frontdesk/frontdesk.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SpaModule } from './modules/spa/spa.module';
import { EventsModule } from './modules/events/events.module';
import { LaundryModule } from './modules/laundry/laundry.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { CrmModule } from './modules/crm/crm.module';
import { HrModule } from './modules/hr/hr.module';
import { ConciergeModule } from './modules/concierge/concierge.module';


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
    ReportsModule,
    AuditLogsModule,
    GuestsModule,
    BarModule,
    RmsModule,
    FrontDeskModule,
    InventoryModule,
    RestaurantModule,
    AccountingModule,
    ChannelModule,
    MaintenanceModule,
    CorporateModule,
    PaymentsModule,
    AnalyticsModule,
    FrontdeskModule,
    TaxesModule,
    NotificationsModule,
    PermissionsModule,
    SpaModule,
    EventsModule,
    LaundryModule,
    ProcurementModule,
    CrmModule,
    HrModule,
    ConciergeModule,


  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
