/*
File Name: set-availability.dto.ts
Path: src/modules/rms/dto/set-availability.dto.ts
*/

import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class SetAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  roomType: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(0)
  totalRooms: number;

  @IsInt()
  @Min(0)
  availableRooms: number;

  @IsBoolean()
  stopSell: boolean;
}
