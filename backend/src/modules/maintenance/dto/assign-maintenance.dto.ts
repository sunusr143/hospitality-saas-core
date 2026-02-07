/*
File Name: assign-maintenance.dto.ts
Path: src/modules/maintenance/dto/assign-maintenance.dto.ts
*/

import { IsUUID } from 'class-validator';

export class AssignMaintenanceDto {
  @IsUUID()
  assignedToId: string;
}
