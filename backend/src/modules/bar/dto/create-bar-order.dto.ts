/*
File Name: create-bar-order.dto.ts
Path: src/modules/bar/dto/create-bar-order.dto.ts
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

export class CreateBarOrderItemDto {
  @IsUUID()
  itemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBarOrderDto {
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
  @Type(() => CreateBarOrderItemDto)
  items: CreateBarOrderItemDto[];
}
