/*
File Name: create-ledger-entry.dto.ts
Path: src/modules/accounting/dto/create-ledger-entry.dto.ts
*/

import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { LedgerEntryType } from '../enums/ledger-entry-type.enum';

export class CreateLedgerEntryDto {
  @IsOptional()
  @IsUUID()
  folioId?: string;

  @IsEnum(LedgerEntryType)
  type: LedgerEntryType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @MaxLength(10)
  currency: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}
