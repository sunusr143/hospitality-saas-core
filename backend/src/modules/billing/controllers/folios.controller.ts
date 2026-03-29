/*
File Name: folios.controller.ts
Path: src/modules/billing/controllers/folios.controller.ts
*/

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Headers,
} from '@nestjs/common';

import { FoliosService } from '../services/folios.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequireModule } from '../../../common/decorators/module-access.decorator';
import { AllowDepartments } from '../../../common/decorators/department-access.decorator';
import { RequireAction } from '../../../common/decorators/action-access.decorator';

import { UserRole } from '../../users/enums/user-role.enum';
import { AddLineItemDto } from '../dto/add-line-item.dto';
import { AddPaymentDto } from '../dto/add-payment.dto';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';

@Controller('folios')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireModule('billing')
@AllowDepartments('Finance', 'Administration')
export class FoliosController {
  constructor(private readonly foliosService: FoliosService) {}

  /**
   * ADMIN — create folio manually (ops / recovery)
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async createFolio(
    @Body('reservationId', ParseUUIDPipe) reservationId: string,
    @Request() req,
  ) {
    return this.foliosService.createFolio({
      tenantId: req.user.tenantId,
      reservationId,
      user: req.user,
    });
  }

  /**
   * ADMIN + STAFF
   */
  @Get(':reservationId')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getByReservation(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Request() req,
  ) {
    return this.foliosService.getFolioForReservation(
      req.user.tenantId,
      reservationId,
    );
  }

  /**
   * ADMIN + STAFF
   */
  @Post(':folioId/line-items')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async addLineItem(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Body() dto: AddLineItemDto,
    @Request() req,
  ) {
    return this.foliosService.addLineItem({
      tenantId: req.user.tenantId,
      folioId,
      dto,
      user: req.user,
    });
  }

  /**
   * ADMIN + STAFF — post a payment
   */
  @Post(':folioId/payments')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @RequireAction('billing.payment.post')
  async addPayment(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Body() dto: AddPaymentDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Request() req,
  ) {
    return this.foliosService.addPayment({
      tenantId: req.user.tenantId,
      folioId,
      dto,
      user: req.user,
      idempotencyKey,
    });
  }

  /**
   * ADMIN only
   */
  @Patch(':folioId/close')
  @Roles(UserRole.ADMIN)
  @RequireAction('billing.folio.close')
  async closeFolio(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Request() req,
  ) {
    return this.foliosService.closeFolio(
      req.user.tenantId,
      folioId,
      req.user,
    );
  }

  /**
   * ADMIN + STAFF — generate invoice (GST optional)
   */
  @Post(':folioId/invoice')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @RequireAction('billing.invoice.generate')
  async generateInvoice(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Body() dto: CreateInvoiceDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Request() req,
  ) {
    return this.foliosService.generateInvoiceForFolio({
      tenantId: req.user.tenantId,
      folioId,
      dto,
      user: req.user,
      idempotencyKey,
    });
  }

  /**
   * ADMIN + STAFF — fetch invoice
   */
  @Get(':folioId/invoice')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getInvoice(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Request() req,
  ) {
    return this.foliosService.getInvoiceForFolio(
      req.user.tenantId,
      folioId,
    );
  }

  /**
   * ADMIN + STAFF — invoice PDF (stub)
   */
  @Get(':folioId/invoice/pdf')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getInvoicePdf(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Request() req,
  ) {
    const pdfBuffer = await this.foliosService.getInvoicePdfStub(
      req.user.tenantId,
      folioId,
    );

    return {
      contentType: 'application/pdf',
      filename: `invoice-${folioId}.pdf`,
      data: pdfBuffer.toString('base64'),
      note: 'PDF stub only; replace with real PDF generator.',
    };
  }

  /**
   * ADMIN + STAFF — folio balance summary
   */
  @Get(':folioId/summary')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getSummary(
    @Param('folioId', ParseUUIDPipe) folioId: string,
    @Request() req,
  ) {
    return this.foliosService.getFolioSummary(
      req.user.tenantId,
      folioId,
    );
  }
}
