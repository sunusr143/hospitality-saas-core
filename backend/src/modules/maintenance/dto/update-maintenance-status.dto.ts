/*
File Name: update-maintenance-status.dto.ts
Path: src/modules/maintenance/dto/update-maintenance-status.dto.ts
*/

import { IsEnum } from 'class-validator';
import { MaintenanceStatus } from '../enums/maintenance-status.enum';

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;
}
