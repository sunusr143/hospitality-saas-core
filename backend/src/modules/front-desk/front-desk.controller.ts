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
import { RequireModule } from '../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../common/decorators/department-access.decorator';
import { RequireAction } from '../../common/decorators/action-access.decorator';

@Controller('front-desk')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('frontdesk')
@AllowDepartments('Front Office', 'Reservations', 'Administration')
export class FrontDeskController {
  constructor(private readonly frontDeskService: FrontDeskService) {}

  /**
   * ADMIN + STAFF — room move
   */
  @Post('room-move')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @RequireAction('frontdesk.room-move')
  async moveRoom(@Body() dto: RoomMoveDto, @Request() req) {
    return this.frontDeskService.moveRoom({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }
}
