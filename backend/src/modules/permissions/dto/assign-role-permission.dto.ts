// File Name: assign-role-permission.dto.ts
// Path: src/modules/permissions/dto/assign-role-permission.dto.ts

import { IsEnum, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';

export class AssignRolePermissionDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MaxLength(120)
  permissionCode: string;
}
