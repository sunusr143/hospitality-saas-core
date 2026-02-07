// File Name: checkout.dto.ts
// Path: src/modules/frontdesk/dto/checkout.dto.ts

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  reservationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
