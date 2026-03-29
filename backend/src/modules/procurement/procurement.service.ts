// File Name: procurement.service.ts
// Path: src/modules/procurement/procurement.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Supplier } from './entities/supplier.entity';
import { StockItem } from './entities/stock-item.entity';
import { StockMovement, StockMovementType } from './entities/stock-movement.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,

    @InjectRepository(StockItem)
    private readonly stockRepository: Repository<StockItem>,

    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async createSupplier(tenantId: string, dto: CreateSupplierDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const supplier = this.supplierRepository.create({
      tenant,
      name: dto.name,
      contactEmail: dto.contactEmail ?? null,
    });

    return this.supplierRepository.save(supplier);
  }

  async listSuppliers(tenantId: string) {
    return this.supplierRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }

  async createStockItem(tenantId: string, dto: CreateStockItemDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    let supplier: Supplier | null = null;
    if (dto.supplierId) {
      supplier = await this.supplierRepository.findOne({
        where: { id: dto.supplierId, tenant: { id: tenantId } },
      });
      if (!supplier) throw new BadRequestException('Invalid supplier');
    }

    const item = this.stockRepository.create({
      tenant,
      name: dto.name,
      quantity: dto.quantity,
      unit: dto.unit,
      unitCost: dto.unitCost ?? 0,
      reorderLevel: dto.reorderLevel ?? 0,
      supplier,
    });

    return this.stockRepository.save(item);
  }

  async listStockItems(tenantId: string) {
    return this.stockRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  async createStockMovement(tenantId: string, dto: CreateStockMovementDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    const stockItem = await this.stockRepository.findOne({
      where: { id: dto.stockItemId, tenant: { id: tenantId } },
      relations: ['tenant', 'supplier'],
    });
    if (!stockItem) throw new BadRequestException('Invalid stock item');

    const delta = dto.type === StockMovementType.ISSUE ? -dto.quantity : dto.quantity;
    if (stockItem.quantity + delta < 0) {
      throw new BadRequestException('Stock quantity cannot go below zero');
    }

    stockItem.quantity += delta;
    if (dto.unitCost != null) {
      stockItem.unitCost = dto.unitCost;
    }
    await this.stockRepository.save(stockItem);

    const movement = this.stockMovementRepository.create({
      tenant,
      stockItem,
      type: dto.type,
      quantity: dto.quantity,
      unitCost: dto.unitCost ?? stockItem.unitCost ?? null,
      reference: dto.reference ?? null,
      notes: dto.notes ?? null,
    });

    return this.stockMovementRepository.save(movement);
  }

  async listStockMovements(tenantId: string) {
    return this.stockMovementRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['stockItem'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInventorySummary(tenantId: string) {
    const items = await this.stockRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['supplier'],
    });

    const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const inventoryValue = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
      0,
    );
    const lowStockItems = items.filter(
      (item) =>
        Number(item.reorderLevel || 0) > 0 &&
        Number(item.quantity || 0) <= Number(item.reorderLevel || 0),
    );

    return {
      stockItemCount: items.length,
      totalUnits,
      inventoryValue: Math.round((inventoryValue + Number.EPSILON) * 100) / 100,
      lowStockCount: lowStockItems.length,
      lowStockItems,
    };
  }
}
