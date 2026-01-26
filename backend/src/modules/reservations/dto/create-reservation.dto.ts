// File Name: create-reservation.dto.ts
// Path: src/modules/reservations/dto/create-reservation.dto.ts

import { IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  roomId: string;

  @IsString()
  guestFullName: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
