// File Name: checkin.dto.ts
// Path: src/modules/frontdesk/dto/checkin.dto.ts

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckinDto {
  @IsUUID()
  reservationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
