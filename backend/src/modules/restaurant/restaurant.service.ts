/*
File Name: restaurant.service.ts
Path: src/modules/restaurant/restaurant.service.ts
*/

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { RestaurantCategory } from './entities/restaurant-category.entity';
import { RestaurantItem } from './entities/restaurant-item.entity';
import { RestaurantOrder } from './entities/restaurant-order.entity';
import { RestaurantOrderItem } from './entities/restaurant-order-item.entity';
import { RestaurantOrderStatus } from './enums/restaurant-order-status.enum';

import { CreateRestaurantCategoryDto } from './dto/create-restaurant-category.dto';
import { UpdateRestaurantCategoryDto } from './dto/update-restaurant-category.dto';
import { CreateRestaurantItemDto } from './dto/create-restaurant-item.dto';
import { UpdateRestaurantItemDto } from './dto/update-restaurant-item.dto';
import { CreateRestaurantOrderDto } from './dto/create-restaurant-order.dto';
import { CancelRestaurantOrderDto } from './dto/cancel-restaurant-order.dto';

import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { Folio } from '../billing/entities/folio.entity';
import { FolioLineItem } from '../billing/entities/folio-line-item.entity';
import { FolioLineItemType } from '../billing/enums/folio-line-item-type.enum';
import { FolioStatus } from '../billing/enums/folio-status.enum';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(RestaurantCategory)
    private readonly categoryRepository: Repository<RestaurantCategory>,

    @InjectRepository(RestaurantItem)
    private readonly itemRepository: Repository<RestaurantItem>,

    @InjectRepository(RestaurantOrder)
    private readonly orderRepository: Repository<RestaurantOrder>,

    @InjectRepository(RestaurantOrderItem)
    private readonly orderItemRepository: Repository<RestaurantOrderItem>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Folio)
    private readonly folioRepository: Repository<Folio>,

    @InjectRepository(FolioLineItem)
    private readonly folioLineItemRepository: Repository<FolioLineItem>,

    private readonly dataSource: DataSource,
  ) {}

  async createCategory(tenantId: string, dto: CreateRestaurantCategoryDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
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

  async updateCategory(tenantId: string, categoryId: string, dto: UpdateRestaurantCategoryDto) {
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

  async createItem(tenantId: string, dto: CreateRestaurantItemDto) {
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

  async updateItem(tenantId: string, itemId: string, dto: UpdateRestaurantItemDto) {
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

  async listItems(tenantId: string) {
    return this.itemRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async createOrder(params: { tenantId: string; dto: CreateRestaurantOrderDto; user: { userId: string } }) {
    const { tenantId, dto, user } = params;

    const creator = await this.userRepository.findOne({ where: { id: user.userId } });
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
      const order = manager.getRepository(RestaurantOrder).create({
        tenant: { id: tenantId } as Tenant,
        createdBy: creator,
        folio,
        currency,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: RestaurantOrderStatus.OPEN,
        postedAt: null,
      });

      const savedOrder = await manager.getRepository(RestaurantOrder).save(order);

      const orderItems = dto.items.map((orderItem) => {
        const item = itemMap.get(orderItem.itemId)!;
        const unitPrice = Number(item.price);
        const totalAmount = this.roundTo2(unitPrice * orderItem.quantity);

        return manager.getRepository(RestaurantOrderItem).create({
          order: savedOrder,
          item,
          nameSnapshot: item.name,
          unitPrice,
          quantity: orderItem.quantity,
          totalAmount,
          notes: orderItem.notes ?? null,
        });
      });

      await manager.getRepository(RestaurantOrderItem).save(orderItems);

      if (dto.postToFolio) {
        if (!folio) {
          throw new BadRequestException('folioId is required to post');
        }

        const lineItem = manager.getRepository(FolioLineItem).create({
          type: FolioLineItemType.FNB_CHARGE,
          description: `Restaurant order ${savedOrder.id}`,
          quantity: 1,
          unitPrice: total,
          totalAmount: total,
          currency,
          tenant: folio.tenant,
          folio,
          postedBy: creator,
          relatedEntityType: 'RESTAURANT_ORDER',
          relatedEntityId: savedOrder.id,
        });

        await manager.getRepository(FolioLineItem).save(lineItem);

        savedOrder.status = RestaurantOrderStatus.POSTED;
        savedOrder.postedAt = new Date();
        await manager.getRepository(RestaurantOrder).save(savedOrder);
      }

      return savedOrder;
    });
  }

  async listOrders(tenantId: string) {
    return this.orderRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['folio', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrder(tenantId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenant: { id: tenantId } },
      relations: ['folio', 'createdBy'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ['item'],
    });

    return { order, items };
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

    if (order.status === RestaurantOrderStatus.POSTED) {
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
        relatedEntityType: 'RESTAURANT_ORDER',
        relatedEntityId: order.id,
      },
    });

    if (!existingLineItem) {
      const lineItem = this.folioLineItemRepository.create({
        type: FolioLineItemType.FNB_CHARGE,
        description: `Restaurant order ${order.id}`,
        quantity: 1,
        unitPrice: order.total,
        totalAmount: order.total,
        currency: order.currency,
        tenant: folio.tenant,
        folio,
        postedBy: order.createdBy,
        relatedEntityType: 'RESTAURANT_ORDER',
        relatedEntityId: order.id,
      });

      await this.folioLineItemRepository.save(lineItem);
    }

    order.status = RestaurantOrderStatus.POSTED;
    order.postedAt = new Date();
    order.folio = folio;
    return this.orderRepository.save(order);
  }

  async cancelOrder(params: { tenantId: string; orderId: string; dto?: CancelRestaurantOrderDto }) {
    const { tenantId, orderId, dto } = params;
    const reverse = dto?.reverseFolioCharge ?? true;

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenant: { id: tenantId } },
      relations: ['tenant', 'createdBy', 'folio'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === RestaurantOrderStatus.CANCELLED) {
      return order;
    }

    if (order.status === RestaurantOrderStatus.POSTED && reverse) {
      if (!order.folio) {
        throw new BadRequestException('Order has no folio to reverse');
      }

      if (order.folio.status === FolioStatus.CLOSED) {
        throw new BadRequestException('Cannot reverse on closed folio');
      }

      const existingReversal = await this.folioLineItemRepository.findOne({
        where: {
          folio: { id: order.folio.id },
          relatedEntityType: 'RESTAURANT_ORDER_REVERSAL',
          relatedEntityId: order.id,
        },
      });

      if (!existingReversal) {
        const reversal = this.folioLineItemRepository.create({
          type: FolioLineItemType.FNB_CHARGE,
          description: `Restaurant order reversal ${order.id}`,
          quantity: 1,
          unitPrice: -Number(order.total),
          totalAmount: -Number(order.total),
          currency: order.currency,
          tenant: order.tenant,
          folio: order.folio,
          postedBy: order.createdBy,
          relatedEntityType: 'RESTAURANT_ORDER_REVERSAL',
          relatedEntityId: order.id,
        });

        await this.folioLineItemRepository.save(reversal);
      }
    }

    order.status = RestaurantOrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  private roundTo2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
