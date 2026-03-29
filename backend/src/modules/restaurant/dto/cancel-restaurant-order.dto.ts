/*
File Name: cancel-restaurant-order.dto.ts
Path: src/modules/restaurant/dto/cancel-restaurant-order.dto.ts
*/

import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CancelRestaurantOrderDto {
  @IsOptional()
  @IsBoolean()
  reverseFolioCharge?: boolean;

  @IsOptional()
  @IsString()
  @Length(3, 255)
  reason?: string;
}
