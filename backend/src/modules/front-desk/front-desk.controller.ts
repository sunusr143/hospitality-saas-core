/*
File Name: front-desk.controller.ts
Path: src/modules/front-desk/front-desk.controller.ts
*/

import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';

import { FrontDeskService } from './front-desk.service';
import { RoomMoveDto } from './dto/room-move.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('front-desk')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FrontDeskController {
  constructor(private readonly frontDeskService: FrontDeskService) {}

  /**
   * ADMIN + STAFF — room move
   */
  @Post('room-move')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async moveRoom(@Body() dto: RoomMoveDto, @Request() req) {
    return this.frontDeskService.moveRoom({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }
}
