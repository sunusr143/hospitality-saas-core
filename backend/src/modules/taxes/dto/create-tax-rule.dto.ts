// File Name: create-tax-rule.dto.ts
// Path: src/modules/taxes/dto/create-tax-rule.dto.ts

import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTaxRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  appliesTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
