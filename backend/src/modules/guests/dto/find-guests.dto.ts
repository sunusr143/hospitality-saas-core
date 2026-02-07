/*
File Name: find-guests.dto.ts
Path: src/modules/guests/dto/find-guests.dto.ts
*/

import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class FindGuestsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  vip?: 'true' | 'false';

  @IsOptional()
  @IsIn(['true', 'false'])
  includeInactive?: 'true' | 'false';
}
