/*
File Name: analytics.service.ts
Path: src/modules/analytics/analytics.service.ts
*/

import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly reportsService: ReportsService) {}

  async getKpis(params: { tenantCode: string; from: string; to: string }) {
    return this.reportsService.getKpis(params);
  }

  async getDailyKpis(params: { tenantCode: string; from: string; to: string }) {
    return this.reportsService.getDailyKpis(params);
  }

  async getRevenueByRoom(params: { tenantCode: string; from: string; to: string }) {
    return this.reportsService.getRevenueByRoom(params);
  }
}
