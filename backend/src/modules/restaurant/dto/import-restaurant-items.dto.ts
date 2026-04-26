import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ImportRestaurantItemsDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  outletLabel?: string;
}
