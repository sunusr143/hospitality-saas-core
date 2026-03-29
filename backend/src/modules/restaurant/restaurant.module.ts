/*
File Name: restaurant.module.ts
Path: src/modules/restaurant/restaurant.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { RestaurantCategory } from './entities/restaurant-category.entity';
import { RestaurantItem } from './entities/restaurant-item.entity';
import { RestaurantOrder } from './entities/restaurant-order.entity';
import { RestaurantOrderItem } from './entities/restaurant-order-item.entity';
import { RestaurantOrderEvent } from './entities/restaurant-order-event.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';
import { FolioLineItem } from '../billing/entities/folio-line-item.entity';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RestaurantCategory,
      RestaurantItem,
      RestaurantOrder,
      RestaurantOrderItem,
      RestaurantOrderEvent,
      Tenant,
      User,
      Folio,
      FolioLineItem,
    ]),
    AccountingModule,
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
})
export class RestaurantModule {}
