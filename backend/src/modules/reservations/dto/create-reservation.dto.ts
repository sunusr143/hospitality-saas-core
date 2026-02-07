// File Name: create-reservation.dto.ts
// Path: src/modules/reservations/dto/create-reservation.dto.ts

import {
  IsUUID,
  IsString,
  IsDateString,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  roomId: string;

  @IsOptional()
  @IsUUID()
  guestId?: string;

  @IsOptional()
  @IsString()
  guestFullName?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsEmail()
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
