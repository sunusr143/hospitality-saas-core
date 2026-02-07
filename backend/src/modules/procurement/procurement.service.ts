// File Name: procurement.service.ts
// Path: src/modules/procurement/procurement.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Supplier } from './entities/supplier.entity';
import { StockItem } from './entities/stock-item.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateStockItemDto } from './dto/create-stock-item.dto';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,

    @InjectRepository(StockItem)
    private readonly stockRepository: Repository<StockItem>,

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

    const item = this.stockRepository.create({
      tenant,
      name: dto.name,
      quantity: dto.quantity,
      unit: dto.unit,
    });

    return this.stockRepository.save(item);
  }

  async listStockItems(tenantId: string) {
    return this.stockRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });
  }
}
