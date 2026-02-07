// File Name: create-shift.dto.ts
// Path: src/modules/hr/dto/create-shift.dto.ts

import { IsDateString, IsUUID } from 'class-validator';

export class CreateShiftDto {
  @IsUUID()
  staffId: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}
