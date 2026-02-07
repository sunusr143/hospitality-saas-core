// File Name: create-supplier.dto.ts
// Path: src/modules/procurement/dto/create-supplier.dto.ts

import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  contactEmail?: string;
}
