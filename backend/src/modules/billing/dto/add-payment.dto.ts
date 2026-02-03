/*
File Name: add-payment.dto.ts
Path: src/modules/billing/dto/add-payment.dto.ts
*/

import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class AddPaymentDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
