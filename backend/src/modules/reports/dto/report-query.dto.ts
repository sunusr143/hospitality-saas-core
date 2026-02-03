/*
File Name: report-query.dto.ts
Path: src/modules/reports/dto/report-query.dto.ts
*/

import { IsDateString } from 'class-validator';

export class ReportQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
