// File Name: find-users.dto.ts
// Path: backend/src/modules/users/dto/find-users.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class FindUsersDto {
  @IsOptional()
  @IsString()
  tenantCode?: string;
}
