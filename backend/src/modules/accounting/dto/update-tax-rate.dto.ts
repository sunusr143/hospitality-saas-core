/*
File Name: update-tax-rate.dto.ts
Path: src/modules/accounting/dto/update-tax-rate.dto.ts
*/

import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateTaxRateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
