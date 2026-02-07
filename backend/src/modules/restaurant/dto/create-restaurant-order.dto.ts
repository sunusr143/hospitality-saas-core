/*
File Name: create-restaurant-order.dto.ts
Path: src/modules/restaurant/dto/create-restaurant-order.dto.ts
*/

import {
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRestaurantOrderItemDto {
  @IsUUID()
  itemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRestaurantOrderDto {
  @IsOptional()
  @IsUUID()
  folioId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @IsOptional()
  @IsBoolean()
  postToFolio?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currency?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantOrderItemDto)
  items: CreateRestaurantOrderItemDto[];
}
