/*
File Name: set-restriction.dto.ts
Path: src/modules/rms/dto/set-restriction.dto.ts
*/

import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SetRestrictionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  roomType: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  minStay: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxStay?: number;

  @IsBoolean()
  closedToArrival: boolean;

  @IsBoolean()
  closedToDeparture: boolean;

  @IsBoolean()
  closed: boolean;
}
