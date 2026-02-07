/*
File Name: create-out-of-order.dto.ts
Path: src/modules/inventory/dto/create-out-of-order.dto.ts
*/

import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOutOfOrderDto {
  @IsUUID()
  roomId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
