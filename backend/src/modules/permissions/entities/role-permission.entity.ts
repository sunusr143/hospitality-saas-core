// File Name: role-permission.entity.ts
// Path: src/modules/permissions/entities/role-permission.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserRole } from '../../users/enums/user-role.enum';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'varchar', length: 120 })
  permissionCode: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
