// File Name: create-inspection.dto.ts
// Path: src/modules/housekeeping/dto/create-inspection.dto.ts

import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateInspectionDto {
  @IsUUID()
  roomId: string;

  @IsBoolean()
  passed: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
