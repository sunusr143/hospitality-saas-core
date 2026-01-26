/*
File Name: add-line-item.dto.ts
Path: src/modules/billing/dto/add-line-item.dto.ts
*/

import {
  IsEnum,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { FolioLineItemType } from '../enums/folio-line-item-type.enum';

export class AddLineItemDto {
  @IsEnum(FolioLineItemType)
  type: FolioLineItemType;

  @IsString()
  description: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;
}
