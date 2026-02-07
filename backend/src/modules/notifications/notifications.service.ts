// File Name: notifications.service.ts
// Path: src/modules/notifications/notifications.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendNotification(params: { tenantId: string; dto: SendNotificationDto }) {
    const { tenantId, dto } = params;

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Invalid tenant');

    let recipient: User | null = null;
    if (dto.recipientId) {
      recipient = await this.userRepository.findOne({ where: { id: dto.recipientId } });
      if (!recipient) throw new NotFoundException('Recipient not found');
    }

    const notification = this.notificationRepository.create({
      tenant,
      recipient,
      channel: dto.channel,
      subject: dto.subject,
      body: dto.body,
      sent: true,
    });

    return this.notificationRepository.save(notification);
  }

  async listNotifications(tenantId: string) {
    return this.notificationRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
    });
  }
}
