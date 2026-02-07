/*
File Name: rms-query.dto.ts
Path: src/modules/rms/dto/rms-query.dto.ts
*/

import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class RmsQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  roomType?: string;
}
