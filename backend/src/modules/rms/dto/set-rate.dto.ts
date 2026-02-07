/*
File Name: set-rate.dto.ts
Path: src/modules/rms/dto/set-rate.dto.ts
*/

import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class SetRateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  roomType: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  baseRate: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency: string;

  @IsOptional()
  @IsUUID()
  ratePlanId?: string;
}
