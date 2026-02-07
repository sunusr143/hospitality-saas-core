/*
File Name: guests.controller.ts
Path: src/modules/guests/guests.controller.ts
*/

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { FindGuestsDto } from './dto/find-guests.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('guests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  /**
   * ADMIN + STAFF — create guest profile
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateGuestDto, @Request() req) {
    return this.guestsService.createGuest({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  /**
   * ADMIN + STAFF — list guest profiles
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(@Query() query: FindGuestsDto, @Request() req) {
    return this.guestsService.findAllForTenant(req.user.tenantId, query);
  }

  /**
   * ADMIN + STAFF — fetch single guest
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.guestsService.findOneForTenant(req.user.tenantId, id);
  }

  /**
   * ADMIN + STAFF — update guest profile
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGuestDto,
    @Request() req,
  ) {
    return this.guestsService.updateGuest({
      tenantId: req.user.tenantId,
      guestId: id,
      dto,
    });
  }
}
