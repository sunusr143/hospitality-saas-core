// File Name: permissions.controller.ts
// Path: src/modules/permissions/permissions.controller.ts

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.createPermission(dto);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN)
  async assign(@Body() dto: AssignRolePermissionDto) {
    return this.permissionsService.assignRolePermission(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async list() {
    return this.permissionsService.listPermissions();
  }

  @Get('roles')
  @Roles(UserRole.ADMIN)
  async listRoles() {
    return this.permissionsService.listRolePermissions();
  }
}
