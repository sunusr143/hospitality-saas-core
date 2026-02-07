/*
File Name: payments.controller.ts
Path: src/modules/payments/payments.controller.ts
*/

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { ReconcilePaymentDto } from './dto/reconcile-payment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('transactions')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreatePaymentTransactionDto, @Request() req) {
    return this.paymentsService.createTransaction({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }

  @Get('transactions')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async list(@Request() req) {
    return this.paymentsService.listTransactions(req.user.tenantId);
  }

  @Post('reconcile')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async reconcile(@Body() dto: ReconcilePaymentDto, @Request() req) {
    return this.paymentsService.reconcileTransaction({
      tenantId: req.user.tenantId,
      dto,
      user: req.user,
    });
  }
}
