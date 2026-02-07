// File Name: create-spa-service.dto.ts
// Path: src/modules/spa/dto/create-spa-service.dto.ts

import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSpaServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsInt()
  @Min(15)
  durationMinutes: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @MaxLength(10)
  currency: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
