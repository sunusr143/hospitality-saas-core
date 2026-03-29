import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

export class CreateStockMovementDto {
  @IsUUID()
  stockItemId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
