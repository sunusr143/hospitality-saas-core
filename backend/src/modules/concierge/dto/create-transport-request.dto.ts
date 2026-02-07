// File Name: create-transport-request.dto.ts
// Path: src/modules/concierge/dto/create-transport-request.dto.ts

import { IsDateString, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTransportRequestDto {
  @IsUUID()
  guestId: string;

  @IsString()
  @MaxLength(200)
  pickupLocation: string;

  @IsString()
  @MaxLength(200)
  dropoffLocation: string;

  @IsDateString()
  pickupAt: string;
}
