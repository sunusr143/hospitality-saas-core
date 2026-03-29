// File Name: frontdesk.controller.ts
// Path: src/modules/frontdesk/frontdesk.controller.ts

import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';

import { FrontdeskService } from './frontdesk.service';
import { CheckinDto } from './dto/checkin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { VerifyGuestDocumentDto } from './dto/verify-guest-document.dto';
import { CollectDepositDto } from './dto/collect-deposit.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('frontdesk')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FrontdeskController {
  constructor(private readonly frontdeskService: FrontdeskService) {}

  @Post('checkin')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async checkIn(@Body() dto: CheckinDto, @Request() req) {
    return this.frontdeskService.checkIn({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Post('checkout')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async checkOut(@Body() dto: CheckoutDto, @Request() req) {
    return this.frontdeskService.checkOut({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Post('verify-document')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async verifyDocument(@Body() dto: VerifyGuestDocumentDto, @Request() req) {
    return this.frontdeskService.verifyGuestDocument({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Post('deposit')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async collectDeposit(@Body() dto: CollectDepositDto, @Request() req) {
    return this.frontdeskService.collectDeposit({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }
}
