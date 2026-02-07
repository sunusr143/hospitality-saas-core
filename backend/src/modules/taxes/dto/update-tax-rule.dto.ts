// File Name: update-tax-rule.dto.ts
// Path: src/modules/taxes/dto/update-tax-rule.dto.ts

import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateTaxRuleDto {
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
  @IsString()
  @MaxLength(80)
  appliesTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
