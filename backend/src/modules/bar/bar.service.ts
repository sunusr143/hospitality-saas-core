/*
File Name: bar.service.ts
Path: src/modules/bar/bar.service.ts
*/

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { BarCategory } from './entities/bar-category.entity';
import { BarItem } from './entities/bar-item.entity';
import { BarOrder } from './entities/bar-order.entity';
import { BarOrderItem } from './entities/bar-order-item.entity';
import { BarOrderEvent } from './entities/bar-order-event.entity';
import { BarOrderStatus } from './enums/bar-order-status.enum';

import { CreateBarCategoryDto } from './dto/create-bar-category.dto';
import { UpdateBarCategoryDto } from './dto/update-bar-category.dto';
import { CreateBarItemDto } from './dto/create-bar-item.dto';
import { UpdateBarItemDto } from './dto/update-bar-item.dto';
import { CreateBarOrderDto } from './dto/create-bar-order.dto';
import { CancelBarOrderDto } from './dto/cancel-bar-order.dto';
import { SeedBarDto } from './dto/seed-bar.dto';
import { FindBarOrdersDto } from './dto/find-bar-orders.dto';
import { FindBarItemsDto } from './dto/find-bar-items.dto';
import { UpdateBarOrderDto } from './dto/update-bar-order.dto';
import { ImportBarItemsDto } from './dto/import-bar-items.dto';

import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';
import { FolioLineItem } from '../billing/entities/folio-line-item.entity';
import { FolioLineItemType } from '../billing/enums/folio-line-item-type.enum';
import { FolioStatus } from '../billing/enums/folio-status.enum';
import { AccountingService } from '../accounting/accounting.service';
import { LedgerEntryType } from '../accounting/enums/ledger-entry-type.enum';

@Injectable()
export class BarService {
  constructor(
    @InjectRepository(BarCategory)
    private readonly categoryRepository: Repository<BarCategory>,

    @InjectRepository(BarItem)
    private readonly itemRepository: Repository<BarItem>,

    @InjectRepository(BarOrder)
    private readonly orderRepository: Repository<BarOrder>,

    @InjectRepository(BarOrderItem)
    private readonly orderItemRepository: Repository<BarOrderItem>,

    @InjectRepository(BarOrderEvent)
    private readonly orderEventRepository: Repository<BarOrderEvent>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,

    @InjectRepository(FolioLineItem)
    private readonly folioLineItemRepository: Repository<FolioLineItem>,

    private readonly dataSource: DataSource,
    private readonly accountingService: AccountingService,
  ) {}

  async createCategory(tenantId: string, dto: CreateBarCategoryDto) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const existing = await this.categoryRepository.findOne({
      where: { tenant: { id: tenantId }, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create({
      tenant,
      name: dto.name,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.categoryRepository.save(category);
  }

  async updateCategory(tenantId: string, categoryId: string, dto: UpdateBarCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenant: { id: tenantId } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { tenant: { id: tenantId }, name: dto.name },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }

      category.name = dto.name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description ?? null;
    }

    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    return this.categoryRepository.save(category);
  }

  async listCategories(tenantId: string) {
    return this.categoryRepository.find({
      where: { tenant: { id: tenantId } },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createItem(tenantId: string, dto: CreateBarItemDto) {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, tenant: { id: tenantId } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const item = this.itemRepository.create({
      tenant: category.tenant,
      category,
      name: dto.name,
      description: dto.description ?? null,
      sku: dto.sku ?? null,
      price: dto.price,
      currency: dto.currency,
      taxRate: dto.taxRate ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.itemRepository.save(item);
  }

  async updateItem(tenantId: string, itemId: string, dto: UpdateBarItemDto) {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, tenant: { id: tenantId } },
      relations: ['category'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, tenant: { id: tenantId } },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      item.category = category;
    }

    if (dto.name !== undefined) {
      item.name = dto.name;
    }

    if (dto.description !== undefined) {
      item.description = dto.description ?? null;
    }

    if (dto.sku !== undefined) {
      item.sku = dto.sku ?? null;
    }

    if (dto.price !== undefined) {
      item.price = dto.price;
    }

    if (dto.currency !== undefined) {
      item.currency = dto.currency;
    }

    if (dto.taxRate !== undefined) {
      item.taxRate = dto.taxRate;
    }

    if (dto.isActive !== undefined) {
      item.isActive = dto.isActive;
    }

    return this.itemRepository.save(item);
  }

  async listItems(tenantId: string, query?: FindBarItemsDto) {
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoin('item.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId });

    if (query?.categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    }

    if (query?.active !== undefined) {
      qb.andWhere('item.isActive = :active', { active: query.active === 'true' });
    }

    return qb.orderBy('item.name', 'ASC').getMany();
  }

  async importItemsFromCsv(params: {
    tenantId: string;
    file: { buffer?: Buffer; originalname?: string } | undefined;
    dto: ImportBarItemsDto;
  }) {
    const { tenantId, file, dto } = params;

    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('CSV file is required');
    }

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const rows = this.parseCsv(file.buffer.toString('utf8'));
    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const headers = rows[0].map((header) => this.normalizeColumnName(header));
    const dataRows = rows
      .slice(1)
      .filter((row) => row.some((value) => value.trim().length > 0));

    if (dataRows.length === 0) {
      throw new BadRequestException('CSV file has no item rows');
    }

    const categories = await this.categoryRepository.find({
      where: { tenant: { id: tenantId } },
    });
    const items = await this.itemRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['category'],
    });

    const categoryByName = new Map(
      categories.map((category) => [category.name.trim().toLowerCase(), category]),
    );
    const itemBySku = new Map<string, BarItem>();
    const itemByName = new Map<string, BarItem>();

    for (const item of items) {
      if (item.sku) {
        itemBySku.set(item.sku.trim().toLowerCase(), item);
      }
      itemByName.set(item.name.trim().toLowerCase(), item);
    }

    const result = {
      fileName: file.originalname ?? 'upload.csv',
      totalRows: dataRows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; message: string }>,
      processed: [] as Array<{
        row: number;
        status: 'created' | 'updated' | 'skipped';
        category: string;
        itemName: string;
        sku: string | null;
      }>,
      expectedColumns: [
        'category',
        'item_code',
        'item_name',
        'price',
        'tax_rate',
        'currency',
        'description',
        'is_active',
      ],
    };

    for (const [index, row] of dataRows.entries()) {
      const rowNumber = index + 2;
      const values = this.buildRowObject(headers, row);

      try {
        const categoryName = this.pickFirst(values, [
          'category',
          'category_name',
          'group',
        ]);
        const itemName = this.pickFirst(values, [
          'item_name',
          'name',
          'drink_name',
          'menu_item',
        ]);
        const sku = this.pickFirst(values, [
          'item_code',
          'itemcode',
          'code',
          'sku',
          'plu',
        ]);
        const description = this.pickFirst(values, ['description', 'desc']) || null;
        const currency = (
          this.pickFirst(values, ['currency']) || dto.defaultCurrency || 'INR'
        )
          .trim()
          .toUpperCase();
        const isActive = this.parseBoolean(
          this.pickFirst(values, ['is_active', 'active']),
          true,
        );
        const price = this.parseNumber(
          this.pickFirst(values, ['price', 'rate', 'amount']),
          'price',
        );
        const taxRate = this.parseTaxRate(
          this.pickFirst(values, ['tax_rate', 'tax', 'gst']),
        );

        if (!categoryName) {
          throw new Error('category is required');
        }

        if (!itemName) {
          throw new Error('item_name is required');
        }

        let category = categoryByName.get(categoryName.trim().toLowerCase());
        if (!category) {
          category = await this.categoryRepository.save(
            this.categoryRepository.create({
              tenant,
              name: categoryName.trim(),
              description: null,
              sortOrder: categoryByName.size,
              isActive: true,
            }),
          );
          categoryByName.set(category.name.trim().toLowerCase(), category);
        }

        const normalizedName = itemName.trim().toLowerCase();
        const normalizedSku = sku ? sku.trim().toLowerCase() : null;
        const existing =
          (normalizedSku ? itemBySku.get(normalizedSku) : undefined) ??
          itemByName.get(normalizedName);

        if (existing) {
          existing.category = category;
          existing.name = itemName.trim();
          existing.description = description;
          existing.sku = sku ? sku.trim() : null;
          existing.price = price;
          existing.currency = currency;
          existing.taxRate = taxRate;
          existing.isActive = isActive;
          await this.itemRepository.save(existing);

          if (normalizedSku) {
            itemBySku.set(normalizedSku, existing);
          }
          itemByName.set(normalizedName, existing);

          result.updated += 1;
          result.processed.push({
            row: rowNumber,
            status: 'updated',
            category: category.name,
            itemName: existing.name,
            sku: existing.sku,
          });
          continue;
        }

        const item = await this.itemRepository.save(
          this.itemRepository.create({
            tenant,
            category,
            name: itemName.trim(),
            description,
            sku: sku ? sku.trim() : null,
            price,
            currency,
            taxRate,
            isActive,
          }),
        );

        if (item.sku) {
          itemBySku.set(item.sku.trim().toLowerCase(), item);
        }
        itemByName.set(item.name.trim().toLowerCase(), item);

        result.created += 1;
        result.processed.push({
          row: rowNumber,
          status: 'created',
          category: category.name,
          itemName: item.name,
          sku: item.sku,
        });
      } catch (error: any) {
        result.errors.push({
          row: rowNumber,
          message: error?.message ?? 'Unknown import error',
        });
      }
    }

    result.skipped = result.errors.length;
    return result;
  }

  async createOrder(params: {
    tenantId: string;
    dto: CreateBarOrderDto;
    user: { userId: string };
  }) {
    const { tenantId, dto, user } = params;

    const creator = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    if (!creator) {
      throw new NotFoundException('Creating user not found');
    }

    let folio: Folio | null = null;
    if (dto.folioId) {
      folio = await this.folioRepository.findOne({
        where: { id: dto.folioId, tenant: { id: tenantId } },
        relations: ['tenant'],
      });

      if (!folio) {
        throw new NotFoundException('Folio not found');
      }

      if (folio.status === FolioStatus.CLOSED) {
        throw new BadRequestException('Cannot post to a closed folio');
      }
    }

    const itemIds = dto.items.map((item) => item.itemId);
    const uniqueItemIds = Array.from(new Set(itemIds));
    const items = await this.itemRepository.find({
      where: { id: In(uniqueItemIds) },
      relations: ['tenant'],
    });

    if (items.length !== uniqueItemIds.length) {
      throw new BadRequestException('One or more items not found');
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));

    for (const item of items) {
      if (item.tenant.id !== tenantId) {
        throw new BadRequestException('Invalid item for tenant');
      }

      if (!item.isActive) {
        throw new BadRequestException(`Item ${item.name} is inactive`);
      }
    }

    const currency = dto.currency ?? items[0].currency;
    if (items.some((item) => item.currency !== currency)) {
      throw new BadRequestException('All items must have same currency');
    }

    const subtotal = this.roundTo2(
      dto.items.reduce((sum, orderItem) => {
        const item = itemMap.get(orderItem.itemId)!;
        return sum + Number(item.price) * orderItem.quantity;
      }, 0),
    );

    const taxRate = dto.taxRate ?? 0;
    const taxAmount = this.roundTo2(subtotal * taxRate);
    const total = this.roundTo2(subtotal + taxAmount);

    return this.dataSource.transaction(async (manager) => {
      const order = manager.getRepository(BarOrder).create({
        tenant: { id: tenantId } as Tenant,
        createdBy: creator,
        folio,
        currency,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: BarOrderStatus.OPEN,
        postedAt: null,
      });

      const savedOrder = await manager.getRepository(BarOrder).save(order);
      await manager.getRepository(BarOrderEvent).save(
        manager.getRepository(BarOrderEvent).create({
          tenant: { id: tenantId } as Tenant,
          order: savedOrder,
          actor: creator,
          eventType: 'CREATED',
          notes: `Order created with ${dto.items.length} items.`,
        }),
      );

      const orderItems = dto.items.map((orderItem) => {
        const item = itemMap.get(orderItem.itemId)!;
        const unitPrice = Number(item.price);
        const totalAmount = this.roundTo2(unitPrice * orderItem.quantity);

        return manager.getRepository(BarOrderItem).create({
          order: savedOrder,
          item,
          nameSnapshot: item.name,
          unitPrice,
          quantity: orderItem.quantity,
          totalAmount,
          notes: orderItem.notes ?? null,
        });
      });

      await manager.getRepository(BarOrderItem).save(orderItems);

      if (dto.postToFolio) {
        if (!folio) {
          throw new BadRequestException('folioId is required to post');
        }

        const lineItem = manager.getRepository(FolioLineItem).create({
          type: FolioLineItemType.BAR_CHARGE,
          description: `Bar order ${savedOrder.id}`,
          quantity: 1,
          unitPrice: total,
          totalAmount: total,
          currency,
          tenant: folio.tenant,
          folio,
          postedBy: creator,
          relatedEntityType: 'BAR_ORDER',
          relatedEntityId: savedOrder.id,
        });

        await manager.getRepository(FolioLineItem).save(lineItem);

        savedOrder.status = BarOrderStatus.POSTED;
        savedOrder.postedAt = new Date();
        savedOrder.lastActionNote = 'Posted directly to folio during order creation.';
        await manager.getRepository(BarOrder).save(savedOrder);
        await manager.getRepository(BarOrderEvent).save(
          manager.getRepository(BarOrderEvent).create({
            tenant: { id: tenantId } as Tenant,
            order: savedOrder,
            actor: creator,
            eventType: 'POSTED',
            notes: `Posted to folio ${folio.id} during order creation.`,
          }),
        );
      }

      return savedOrder;
    });
  }

  async listOrders(tenantId: string, query?: FindBarOrdersDto) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.folio', 'folio')
      .leftJoinAndSelect('folio.room', 'room')
      .leftJoinAndSelect('folio.reservation', 'reservation')
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .leftJoin('order.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId });

    if (query?.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query?.from) {
      qb.andWhere('order.createdAt >= :from', { from: new Date(query.from) });
    }

    if (query?.to) {
      const toDate = new Date(query.to);
      toDate.setDate(toDate.getDate() + 1);
      qb.andWhere('order.createdAt < :to', { to: toDate });
    }

    return qb.orderBy('order.createdAt', 'DESC').getMany();
  }

  async getOrder(tenantId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenant: { id: tenantId } },
      relations: ['folio', 'folio.room', 'folio.reservation', 'createdBy'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ['item'],
    });

    const events = await this.orderEventRepository.find({
      where: { tenant: { id: tenantId }, order: { id: orderId } },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });

    return { order, items, events };
  }

  async updateOrder(params: {
    tenantId: string;
    orderId: string;
    dto: UpdateBarOrderDto;
  }) {
    const { tenantId, orderId, dto } = params;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenant: { id: tenantId } },
      relations: ['tenant', 'folio'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== BarOrderStatus.OPEN) {
      throw new BadRequestException('Only open orders can be updated. Cancel and recreate posted orders.');
    }

    let folio: Folio | null = null;
    if (dto.folioId) {
      folio = await this.folioRepository.findOne({
        where: { id: dto.folioId, tenant: { id: tenantId } },
        relations: ['tenant'],
      });

      if (!folio) {
        throw new NotFoundException('Folio not found');
      }

      if (folio.status === FolioStatus.CLOSED) {
        throw new BadRequestException('Cannot attach a closed folio');
      }
    }

    const itemIds = dto.items.map((item) => item.itemId);
    const uniqueItemIds = Array.from(new Set(itemIds));
    const items = await this.itemRepository.find({
      where: { id: In(uniqueItemIds) },
      relations: ['tenant'],
    });

    if (items.length !== uniqueItemIds.length) {
      throw new BadRequestException('One or more items not found');
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));

    for (const item of items) {
      if (item.tenant.id !== tenantId) {
        throw new BadRequestException('Invalid item for tenant');
      }

      if (!item.isActive) {
        throw new BadRequestException(`Item ${item.name} is inactive`);
      }
    }

    const currency = dto.currency ?? items[0].currency;
    if (items.some((item) => item.currency !== currency)) {
      throw new BadRequestException('All items must have same currency');
    }

    const subtotal = this.roundTo2(
      dto.items.reduce((sum, orderItem) => {
        const item = itemMap.get(orderItem.itemId)!;
        return sum + Number(item.price) * orderItem.quantity;
      }, 0),
    );
    const taxRate = dto.taxRate ?? 0;
    const taxAmount = this.roundTo2(subtotal * taxRate);
    const total = this.roundTo2(subtotal + taxAmount);

    return this.dataSource.transaction(async (manager) => {
      order.folio = folio;
      order.currency = currency;
      order.subtotal = subtotal;
      order.taxRate = taxRate;
      order.taxAmount = taxAmount;
      order.total = total;
      order.lastActionNote = 'Open order updated before posting.';

      const savedOrder = await manager.getRepository(BarOrder).save(order);
      await manager.getRepository(BarOrderItem).delete({ order: { id: orderId } });

      const orderItems = dto.items.map((orderItem) => {
        const item = itemMap.get(orderItem.itemId)!;
        const unitPrice = Number(item.price);
        const totalAmount = this.roundTo2(unitPrice * orderItem.quantity);

        return manager.getRepository(BarOrderItem).create({
          order: savedOrder,
          item,
          nameSnapshot: item.name,
          unitPrice,
          quantity: orderItem.quantity,
          totalAmount,
          notes: orderItem.notes ?? null,
        });
      });

      await manager.getRepository(BarOrderItem).save(orderItems);
      await manager.getRepository(BarOrderEvent).save(
        manager.getRepository(BarOrderEvent).create({
          tenant: { id: tenantId } as Tenant,
          order: savedOrder,
          actor: null,
          eventType: 'UPDATED',
          notes: `Order updated to ${dto.items.length} items and total ${total}.`,
        }),
      );
      return savedOrder;
    });
  }

  async postOrderToFolio(params: { tenantId: string; orderId: string; folioId: string }) {
    const { tenantId, orderId, folioId } = params;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenant: { id: tenantId } },
      relations: ['tenant', 'createdBy'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === BarOrderStatus.POSTED) {
      return order;
    }

    const folio = await this.folioRepository.findOne({
      where: { id: folioId, tenant: { id: tenantId } },
    });

    if (!folio) {
      throw new NotFoundException('Folio not found');
    }

    if (folio.status === FolioStatus.CLOSED) {
      throw new BadRequestException('Cannot post to a closed folio');
    }

    const existingLineItem = await this.folioLineItemRepository.findOne({
      where: {
        folio: { id: folio.id },
        relatedEntityType: 'BAR_ORDER',
        relatedEntityId: order.id,
      },
    });

    if (!existingLineItem) {
      const lineItem = this.folioLineItemRepository.create({
        type: FolioLineItemType.BAR_CHARGE,
        description: `Bar order ${order.id}`,
        quantity: 1,
        unitPrice: order.total,
        totalAmount: order.total,
        currency: order.currency,
        tenant: folio.tenant,
        folio,
        postedBy: order.createdBy,
        relatedEntityType: 'BAR_ORDER',
        relatedEntityId: order.id,
      });

      await this.folioLineItemRepository.save(lineItem);

      await this.accountingService.recordSystemEntry({
        tenantId,
        folioId: folio.id,
        userId: order.createdBy?.id ?? null,
        type: LedgerEntryType.CHARGE,
        amount: Number(order.total),
        currency: order.currency,
        reference: `bar-order:${order.id}`,
      });
    }

    order.status = BarOrderStatus.POSTED;
    order.postedAt = new Date();
    order.folio = folio;
    order.lastActionNote = `Posted to folio ${folio.id}.`;
    const saved = await this.orderRepository.save(order);
    await this.orderEventRepository.save(
      this.orderEventRepository.create({
        tenant: { id: tenantId } as Tenant,
        order: saved,
        actor: order.createdBy ?? null,
        eventType: 'POSTED',
        notes: `Posted to folio ${folio.id}.`,
      }),
    );
    return saved;
  }

  async closeOrder(params: { tenantId: string; orderId: string }) {
    const { tenantId, orderId } = params;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenant: { id: tenantId } },
      relations: ['tenant', 'createdBy', 'folio'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === BarOrderStatus.CLOSED) {
      return order;
    }

    if (order.status === BarOrderStatus.OPEN && order.folio) {
      throw new BadRequestException('Post folio orders before closing them');
    }

    if (![BarOrderStatus.OPEN, BarOrderStatus.POSTED].includes(order.status)) {
      throw new BadRequestException('Only open or posted orders can be printed and closed');
    }

    order.status = BarOrderStatus.CLOSED;
    order.lastActionNote =
      order.postedAt || order.folio ? 'Printed and closed after folio posting.' : 'Printed and closed as direct bar sale.';
    const saved = await this.orderRepository.save(order);
    await this.orderEventRepository.save(
      this.orderEventRepository.create({
        tenant: { id: tenantId } as Tenant,
        order: saved,
        actor: order.createdBy ?? null,
        eventType: 'CLOSED',
        notes: order.lastActionNote,
      }),
    );
    return saved;
  }

  async cancelOrder(params: {
    tenantId: string;
    orderId: string;
    dto?: CancelBarOrderDto;
  }) {
    const { tenantId, orderId, dto } = params;
    const reverse = dto?.reverseFolioCharge ?? true;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenant: { id: tenantId } },
      relations: ['tenant', 'createdBy', 'folio'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === BarOrderStatus.CANCELLED) {
      return order;
    }

    if (order.status === BarOrderStatus.CLOSED) {
      throw new BadRequestException('Closed orders cannot be cancelled');
    }

    if (order.status === BarOrderStatus.POSTED && reverse) {
      if (!order.folio) {
        throw new BadRequestException('Order has no folio to reverse');
      }

      if (order.folio.status === FolioStatus.CLOSED) {
        throw new BadRequestException('Cannot reverse on closed folio');
      }

      const existingReversal = await this.folioLineItemRepository.findOne({
        where: {
          folio: { id: order.folio.id },
          relatedEntityType: 'BAR_ORDER_REVERSAL',
          relatedEntityId: order.id,
        },
      });

      if (!existingReversal) {
        const reversal = this.folioLineItemRepository.create({
          type: FolioLineItemType.BAR_CHARGE,
          description: `Bar order reversal ${order.id}`,
          quantity: 1,
          unitPrice: -Number(order.total),
          totalAmount: -Number(order.total),
          currency: order.currency,
          tenant: order.tenant,
          folio: order.folio,
          postedBy: order.createdBy,
          relatedEntityType: 'BAR_ORDER_REVERSAL',
          relatedEntityId: order.id,
        });

        await this.folioLineItemRepository.save(reversal);
      }
    }

    order.status = BarOrderStatus.CANCELLED;
    order.cancellationReason = dto?.reason ?? order.cancellationReason ?? 'Order cancelled';
    order.lastActionNote = order.cancellationReason;
    const saved = await this.orderRepository.save(order);
    await this.orderEventRepository.save(
      this.orderEventRepository.create({
        tenant: { id: tenantId } as Tenant,
        order: saved,
        actor: order.createdBy ?? null,
        eventType: 'CANCELLED',
        notes: order.cancellationReason,
      }),
    );
    return saved;
  }

  async seedDefaults(params: { tenantId: string; dto?: SeedBarDto }) {
    const { tenantId, dto } = params;
    const currency = dto?.currency ?? 'INR';
    const taxRate = dto?.taxRate ?? 0;

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    const defaultCategories = [
      { name: 'Cocktails', description: 'Signature and classic cocktails' },
      { name: 'Beer', description: 'Local and imported beers' },
      { name: 'Wine', description: 'Red, white, and sparkling' },
      { name: 'Snacks', description: 'Small bites and bar snacks' },
    ];

    const categoryEntities: BarCategory[] = [];
    for (const [index, cat] of defaultCategories.entries()) {
      let category = await this.categoryRepository.findOne({
        where: { tenant: { id: tenantId }, name: cat.name },
      });

      if (!category) {
        category = this.categoryRepository.create({
          tenant,
          name: cat.name,
          description: cat.description,
          sortOrder: index,
          isActive: true,
        });
        category = await this.categoryRepository.save(category);
      }

      categoryEntities.push(category);
    }

    const itemsByCategory: Record<string, Array<{ name: string; price: number }>> = {
      Cocktails: [
        { name: 'Classic Mojito', price: 450 },
        { name: 'Negroni', price: 500 },
      ],
      Beer: [
        { name: 'Lager Pint', price: 300 },
        { name: 'IPA Pint', price: 350 },
      ],
      Wine: [
        { name: 'House Red Glass', price: 400 },
        { name: 'House White Glass', price: 400 },
      ],
      Snacks: [
        { name: 'Spiced Nuts', price: 200 },
        { name: 'Fries', price: 250 },
      ],
    };

    for (const category of categoryEntities) {
      const items = itemsByCategory[category.name] ?? [];
      for (const item of items) {
        const existing = await this.itemRepository.findOne({
          where: { tenant: { id: tenantId }, name: item.name, category: { id: category.id } },
        });

        if (!existing) {
          const entity = this.itemRepository.create({
            tenant,
            category,
            name: item.name,
            description: null,
            sku: null,
            price: item.price,
            currency,
            taxRate,
            isActive: true,
          });
          await this.itemRepository.save(entity);
        }
      }
    }

    return { categories: categoryEntities.length };
  }

  private roundTo2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private normalizeColumnName(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private buildRowObject(headers: string[], row: string[]) {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      values[header] = (row[index] ?? '').trim();
    });
    return values;
  }

  private pickFirst(values: Record<string, string>, keys: string[]) {
    for (const key of keys) {
      const value = values[key];
      if (value && value.trim() !== '') {
        return value.trim();
      }
    }
    return '';
  }

  private parseNumber(rawValue: string, fieldName: string) {
    if (!rawValue) {
      throw new Error(`${fieldName} is required`);
    }

    const parsed = Number(rawValue.replace(/,/g, ''));
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new Error(`${fieldName} must be a non-negative number`);
    }

    return this.roundTo2(parsed);
  }

  private parseTaxRate(rawValue: string) {
    if (!rawValue) {
      return 0;
    }

    const parsed = Number(rawValue.replace(/%/g, '').trim());
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new Error('tax_rate must be a non-negative number');
    }

    return parsed > 1 ? this.roundTo2(parsed / 100) : this.roundTo2(parsed);
  }

  private parseBoolean(rawValue: string, fallback: boolean) {
    if (!rawValue) {
      return fallback;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'active'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'inactive'].includes(normalized)) {
      return false;
    }

    throw new Error('is_active must be true/false');
  }

  private parseCsv(input: string) {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      const next = input[index + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          currentValue += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        currentRow.push(currentValue);
        currentValue = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          index += 1;
        }
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = '';
        continue;
      }

      currentValue += char;
    }

    if (currentValue.length > 0 || currentRow.length > 0) {
      currentRow.push(currentValue);
      rows.push(currentRow);
    }

    return rows;
  }
}
