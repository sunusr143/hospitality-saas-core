// File Name: create-permission.dto.ts
// Path: src/modules/permissions/dto/create-permission.dto.ts

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;
}
