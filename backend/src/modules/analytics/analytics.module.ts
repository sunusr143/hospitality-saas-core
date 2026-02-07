/*
File Name: analytics.module.ts
Path: src/modules/analytics/analytics.module.ts
*/

import { Module } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
