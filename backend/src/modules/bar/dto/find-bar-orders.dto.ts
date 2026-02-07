/*
File Name: find-bar-orders.dto.ts
Path: src/modules/bar/dto/find-bar-orders.dto.ts
*/

import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { BarOrderStatus } from '../enums/bar-order-status.enum';

export class FindBarOrdersDto {
  @IsOptional()
  @IsIn([BarOrderStatus.OPEN, BarOrderStatus.POSTED, BarOrderStatus.CANCELLED])
  status?: BarOrderStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
