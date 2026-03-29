/*
File Name: rooms.controller.ts
Path: src/modules/rooms/rooms.controller.ts
*/

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';
import { RequireAction } from '../../common/decorators/action-access.decorator';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('rooms')
@AllowDepartments('Front Office', 'Reservations', 'Housekeeping', 'Maintenance', 'Administration')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateRoomDto, @Request() req) {
    dto.tenantCode = req.user.tenantCode;
    return this.roomsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(@Request() req) {
    return this.roomsService.findAll(req.user.tenantCode);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @RequireAction('rooms.status.update')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    return this.roomsService.updateStatus(id, dto.status);
  }
}
