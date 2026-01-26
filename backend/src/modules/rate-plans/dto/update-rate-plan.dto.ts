// File Name: update-rate-plan.dto.ts
// Path: src/modules/rate-plans/dto/update-rate-plan.dto.ts

import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RatePlanStatus } from '../enums/rate-plan-status.enum';

export class UpdateRatePlanDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string;

  @IsEnum(RatePlanStatus)
  @IsOptional()
  status?: RatePlanStatus;
}
