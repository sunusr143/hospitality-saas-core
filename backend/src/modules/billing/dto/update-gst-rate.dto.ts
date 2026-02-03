/*
File Name: update-gst-rate.dto.ts
Path: src/modules/billing/dto/update-gst-rate.dto.ts
*/

import { IsNumber, Max, Min } from 'class-validator';

export class UpdateGstRateDto {
  /**
   * GST rate as a decimal (e.g. 0.12 for 12%).
   */
  @IsNumber()
  @Min(0)
  @Max(1)
  gstRate: number;
}
