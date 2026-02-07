// File Name: reconcile-payment.dto.ts
// Path: src/modules/payments/dto/reconcile-payment.dto.ts

import { IsString, IsUUID, MaxLength } from 'class-validator';

export class ReconcilePaymentDto {
  @IsUUID()
  transactionId: string;

  @IsString()
  @MaxLength(120)
  reconciliationReference: string;
}
