// File Name: permissions.service.ts
// Path: src/modules/permissions/permissions.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.permissionRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Permission already exists');

    const permission = this.permissionRepository.create({
      code: dto.code,
      description: dto.description,
    });

    return this.permissionRepository.save(permission);
  }

  async assignRolePermission(dto: AssignRolePermissionDto) {
    const permission = await this.permissionRepository.findOne({ where: { code: dto.permissionCode } });
    if (!permission) throw new BadRequestException('Permission not found');

    const existing = await this.rolePermissionRepository.findOne({
      where: { role: dto.role, permissionCode: dto.permissionCode },
    });
    if (existing) return existing;

    const mapping = this.rolePermissionRepository.create({
      role: dto.role,
      permissionCode: dto.permissionCode,
    });

    return this.rolePermissionRepository.save(mapping);
  }

  async listPermissions() {
    return this.permissionRepository.find({ order: { createdAt: 'DESC' } });
  }

  async listRolePermissions() {
    return this.rolePermissionRepository.find({ order: { createdAt: 'DESC' } });
  }
}
