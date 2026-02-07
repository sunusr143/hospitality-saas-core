// File Name: assign-housekeeping.dto.ts
// Path: src/modules/housekeeping/dto/assign-housekeeping.dto.ts

import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AssignHousekeepingDto {
  @IsUUID()
  assignedToId: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
