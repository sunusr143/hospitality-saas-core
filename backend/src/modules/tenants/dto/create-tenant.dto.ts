// File Name: create-tenant.dto.ts
// Path: backend/src/modules/tenants/dto/create-tenant.dto.ts

import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code must be uppercase letters, numbers, or underscores',
  })
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(3, 120)
  softwareName?: string;

  @IsOptional()
  @IsString()
  @Length(5, 160)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 160)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  country?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @Length(3, 80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @Length(5, 5)
  checkInTime?: string;

  @IsOptional()
  @IsString()
  @Length(5, 5)
  checkOutTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  enabledModules?: string[];
}
