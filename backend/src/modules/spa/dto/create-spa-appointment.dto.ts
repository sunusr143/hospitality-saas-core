// File Name: create-spa-appointment.dto.ts
// Path: src/modules/spa/dto/create-spa-appointment.dto.ts

import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateSpaAppointmentDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  guestId: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsDateString()
  startAt: string;
}
