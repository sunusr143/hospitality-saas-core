/*
File Name: create-invoice.dto.ts
Path: src/modules/billing/dto/create-invoice.dto.ts
*/

import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateInvoiceDto {
  /**
   * GST rate as a decimal (e.g. 0.12 for 12%).
   */
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  gstRate?: number;
}
