// File Name: notifications.controller.ts
// Path: src/modules/notifications/notifications.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async send(@Body() dto: SendNotificationDto, @Request() req) {
    return this.notificationsService.sendNotification({
      tenantId: req.user.tenantId,
      dto,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.notificationsService.listNotifications(req.user.tenantId);
  }
}
