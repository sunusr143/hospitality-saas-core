// File Name: update-housekeeping-status.dto.ts
// Path: src/modules/housekeeping/dto/update-housekeeping-status.dto.ts

import { IsEnum } from 'class-validator';
import { HousekeepingStatus } from '../enums/housekeeping-status.enum';

export class UpdateHousekeepingStatusDto {
  @IsEnum(HousekeepingStatus)
  status: HousekeepingStatus;
}
