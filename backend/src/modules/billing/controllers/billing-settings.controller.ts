/*
File Name: billing-settings.controller.ts
Path: src/modules/billing/controllers/billing-settings.controller.ts
*/

import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BillingSettingsService } from '../services/billing-settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { UpdateGstRateDto } from '../dto/update-gst-rate.dto';

@Controller('billing/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingSettingsController {
  constructor(
    private readonly billingSettingsService: BillingSettingsService,
  ) {}

  /**
   * ADMIN — fetch GST default
   */
  @Get('tax')
  @Roles(UserRole.ADMIN)
  async getGst(@Request() req) {
    return this.billingSettingsService.getSettings(req.user.tenantId);
  }

  /**
   * ADMIN — update GST default
   */
  @Put('tax')
  @Roles(UserRole.ADMIN)
  async updateGst(
    @Body() dto: UpdateGstRateDto,
    @Request() req,
  ) {
    return this.billingSettingsService.upsertGstRate(
      req.user.tenantId,
      dto.gstRate,
    );
  }
}
