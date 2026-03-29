// File Name: events.controller.ts
// Path: src/modules/events/events.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('operations')
@AllowDepartments('Sales', 'Administration', 'Front Office')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateEventDto, @Request() req) {
    return this.eventsService.createEvent(req.user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.eventsService.listEvents(req.user.tenantId);
  }
}
