/*
File Name: create-corporate-account.dto.ts
Path: src/modules/corporate/dto/create-corporate-account.dto.ts
*/

import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCorporateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingAddress?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
