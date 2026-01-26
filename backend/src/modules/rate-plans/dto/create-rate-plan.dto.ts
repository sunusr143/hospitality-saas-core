// File Name: create-rate-plan.dto.ts
// Path: src/modules/rate-plans/dto/create-rate-plan.dto.ts

import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  basePrice: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;
}
