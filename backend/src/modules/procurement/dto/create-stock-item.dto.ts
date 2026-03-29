// File Name: create-stock-item.dto.ts
// Path: src/modules/procurement/dto/create-stock-item.dto.ts

import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateStockItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsString()
  @MaxLength(40)
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
