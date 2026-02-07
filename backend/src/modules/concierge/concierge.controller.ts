// File Name: concierge.controller.ts
// Path: src/modules/concierge/concierge.controller.ts

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { ConciergeService } from './concierge.service';
import { CreateTransportRequestDto } from './dto/create-transport-request.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('concierge')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConciergeController {
  constructor(private readonly conciergeService: ConciergeService) {}

  @Post('transport')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createTransport(@Body() dto: CreateTransportRequestDto, @Request() req) {
    return this.conciergeService.createRequest(req.user.tenantId, dto);
  }

  @Get('transport')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async listTransport(@Request() req) {
    return this.conciergeService.listRequests(req.user.tenantId);
  }
}
