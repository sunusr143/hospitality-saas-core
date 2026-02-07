/*
File Name: seed-bar.dto.ts
Path: src/modules/bar/dto/seed-bar.dto.ts
*/

import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SeedBarDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;
}
