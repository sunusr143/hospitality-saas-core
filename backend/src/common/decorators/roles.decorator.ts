/*
File Name: roles.decorator.ts
Path: src/common/decorators/roles.decorator.ts
*/

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/enums/user-role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
