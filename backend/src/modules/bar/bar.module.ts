/*
File Name: bar.module.ts
Path: src/modules/bar/bar.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BarService } from './bar.service';
import { BarController } from './bar.controller';
import { BarCategory } from './entities/bar-category.entity';
import { BarItem } from './entities/bar-item.entity';
import { BarOrder } from './entities/bar-order.entity';
import { BarOrderItem } from './entities/bar-order-item.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';
import { FolioLineItem } from '../billing/entities/folio-line-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BarCategory,
      BarItem,
      BarOrder,
      BarOrderItem,
      Tenant,
      User,
      Folio,
      FolioLineItem,
    ]),
  ],
  controllers: [BarController],
  providers: [BarService],
})
export class BarModule {}
