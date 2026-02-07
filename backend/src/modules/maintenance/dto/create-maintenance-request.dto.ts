/*
File Name: create-maintenance-request.dto.ts
Path: src/modules/maintenance/dto/create-maintenance-request.dto.ts
*/

import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @IsUUID()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
