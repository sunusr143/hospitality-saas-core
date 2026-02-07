// File Name: permission.entity.ts
// Path: src/modules/permissions/entities/permission.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
