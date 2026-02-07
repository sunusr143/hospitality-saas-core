/*
File Name: resolve-out-of-order.dto.ts
Path: src/modules/inventory/dto/resolve-out-of-order.dto.ts
*/

import { IsDateString, IsOptional } from 'class-validator';

export class ResolveOutOfOrderDto {
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
