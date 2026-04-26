import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ImportBarItemsDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultCurrency?: string;
}
