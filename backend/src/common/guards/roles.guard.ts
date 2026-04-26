/*
File Name: roles.guard.ts
Path: src/common/guards/roles.guard.ts
*/

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/enums/user-role.enum';
import { MODULE_ACCESS_KEY } from '../decorators/module-access.decorator';
import { DEPARTMENT_ACCESS_KEY } from '../decorators/department-access.decorator';
import { ACTION_ACCESS_KEY } from '../decorators/action-access.decorator';
import { ACTION_POLICY } from '../permissions/action-policy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredModule = this.reflector.getAllAndOverride<string>(
      MODULE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const allowedDepartments = this.reflector.getAllAndOverride<string[]>(
      DEPARTMENT_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredAction = this.reflector.getAllAndOverride<string>(
      ACTION_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied');
    }

    const isSuperUser = user.role === UserRole.SUPER_USER;
    const matchesRequiredRole =
      !requiredRoles ||
      requiredRoles.length === 0 ||
      requiredRoles.includes(user.role) ||
      (isSuperUser && requiredRoles.includes(UserRole.ADMIN));

    if (!matchesRequiredRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    if (requiredModule && !isSuperUser) {
      const enabledModules = Array.isArray(user.enabledModules)
        ? user.enabledModules
        : [];

      if (!enabledModules.includes(requiredModule)) {
        throw new ForbiddenException(
          `The ${requiredModule} module is not enabled for this hotel`,
        );
      }
    }

    if (
      allowedDepartments &&
      allowedDepartments.length > 0 &&
      user.role !== UserRole.ADMIN &&
      !isSuperUser
    ) {
      const department = String(user.department ?? '').toLowerCase();
      if (!allowedDepartments.includes(department)) {
        throw new ForbiddenException(
          'Your department does not have access to this resource',
        );
      }
    }

    if (requiredAction && user.role !== UserRole.ADMIN && !isSuperUser) {
      const department = String(user.department ?? '').toLowerCase();
      const allowedActionDepartments = ACTION_POLICY[requiredAction] ?? [];
      if (!allowedActionDepartments.includes(department)) {
        throw new ForbiddenException(
          'Your department does not have permission for this action',
        );
      }
    }

    return true;
  }
}
