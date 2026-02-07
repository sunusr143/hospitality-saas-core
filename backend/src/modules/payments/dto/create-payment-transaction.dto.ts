/*
File Name: create-payment-transaction.dto.ts
Path: src/modules/payments/dto/create-payment-transaction.dto.ts
*/

import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PaymentStatus } from '../enums/payment-status.enum';

export class CreatePaymentTransactionDto {
  @IsOptional()
  @IsUUID()
  folioId?: string;

  @IsString()
  @MaxLength(40)
  provider: string;

  @IsString()
  @MaxLength(80)
  providerReference: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @MaxLength(10)
  currency: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  metadata?: any;
}
