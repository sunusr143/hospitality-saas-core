/*
File Name: audit-log-query.dto.ts
Path: src/modules/audit-logs/dto/audit-log-query.dto.ts
*/

import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class AuditLogQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}
