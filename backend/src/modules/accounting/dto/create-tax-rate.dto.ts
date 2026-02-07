/*
File Name: create-tax-rate.dto.ts
Path: src/modules/accounting/dto/create-tax-rate.dto.ts
*/

import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTaxRateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
