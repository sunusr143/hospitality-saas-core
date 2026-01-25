// File Name: create-tenant.dto.ts
// Path: backend/src/modules/tenants/dto/create-tenant.dto.ts

import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

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
}
