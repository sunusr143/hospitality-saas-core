// File Name: create-event.dto.ts
// Path: src/modules/events/dto/create-event.dto.ts

import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsInt()
  @Min(0)
  expectedGuests: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
