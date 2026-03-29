// File Name: procurement.module.ts
// Path: src/modules/procurement/procurement.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { Supplier } from './entities/supplier.entity';
import { StockItem } from './entities/stock-item.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, StockItem, StockMovement, Tenant])],
  controllers: [ProcurementController],
  providers: [ProcurementService],
})
export class ProcurementModule {}
