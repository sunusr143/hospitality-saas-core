// File Name: collect-deposit.dto.ts
// Path: src/modules/frontdesk/dto/collect-deposit.dto.ts

import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CollectDepositDto {
  @IsUUID()
  reservationId: string;

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
