// File Name: create-housekeeping-task.dto.ts
// Path: src/modules/housekeeping/dto/create-housekeeping-task.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { HousekeepingPriority } from '../enums/housekeeping-priority.enum';

export class CreateHousekeepingTaskDto {
  @IsString()
  roomId: string;

  @IsEnum(HousekeepingPriority)
  @IsOptional()
  priority?: HousekeepingPriority;

  @IsString()
  @IsOptional()
  notes?: string;
}
