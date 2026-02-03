/*
File Name: reports.controller.ts
Path: src/modules/reports/reports.controller.ts
*/

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * ADMIN + STAFF — key KPIs
   */
  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getKpis(@Query() query: ReportQueryDto, @Request() req) {
    return this.reportsService.getKpis({
      tenantCode: req.user.tenantCode,
      from: query.from,
      to: query.to,
    });
  }

  /**
   * ADMIN + STAFF — daily occupancy KPIs
   */
  @Get('kpis/daily')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getDailyKpis(@Query() query: ReportQueryDto, @Request() req) {
    return this.reportsService.getDailyKpis({
      tenantCode: req.user.tenantCode,
      from: query.from,
      to: query.to,
    });
  }

  /**
   * ADMIN + STAFF — KPIs CSV export
   */
  @Get('kpis.csv')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getKpisCsv(
    @Query() query: ReportQueryDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.reportsService.getKpis({
      tenantCode: req.user.tenantCode,
      from: query.from,
      to: query.to,
    });

    const rows = [
      ['metric', 'value'],
      ['from', data.from],
      ['to', data.to],
      ['roomCount', data.roomCount],
      ['availableRoomNights', data.availableRoomNights],
      ['occupiedNights', data.occupiedNights],
      ['occupancyRate', data.occupancyRate],
      ['adr', data.adr],
      ['revPar', data.revPar],
      ['roomRevenue', data.revenue.roomRevenue],
      ['netRevenue', data.revenue.netRevenue],
      ['tax', data.revenue.tax],
      ['grossRevenue', data.revenue.grossRevenue],
      ['payments', data.revenue.payments],
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="kpis-${data.from}-to-${data.to}.csv"`,
    );

    return csv;
  }

  /**
   * ADMIN + STAFF — revenue by room
   */
  @Get('revenue/rooms')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getRevenueByRoom(@Query() query: ReportQueryDto, @Request() req) {
    return this.reportsService.getRevenueByRoom({
      tenantCode: req.user.tenantCode,
      from: query.from,
      to: query.to,
    });
  }
}
