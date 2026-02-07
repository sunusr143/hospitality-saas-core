/*
File Name: analytics.controller.ts
Path: src/modules/analytics/analytics.controller.ts
*/

import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { ReportQueryDto } from '../reports/dto/report-query.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getKpis(@Query() query: ReportQueryDto, @Request() req) {
    return this.analyticsService.getKpis({
      tenantCode: req.user.tenantCode ?? req.user.tenantId,
      from: query.from,
      to: query.to,
    });
  }

  @Get('daily-kpis')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getDaily(@Query() query: ReportQueryDto, @Request() req) {
    return this.analyticsService.getDailyKpis({
      tenantCode: req.user.tenantCode ?? req.user.tenantId,
      from: query.from,
      to: query.to,
    });
  }

  @Get('revenue-by-room')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getRevenue(@Query() query: ReportQueryDto, @Request() req) {
    return this.analyticsService.getRevenueByRoom({
      tenantCode: req.user.tenantCode ?? req.user.tenantId,
      from: query.from,
      to: query.to,
    });
  }
}
