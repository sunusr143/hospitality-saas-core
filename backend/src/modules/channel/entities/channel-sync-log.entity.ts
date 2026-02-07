/*
File Name: channel-sync-log.entity.ts
Path: src/modules/channel/entities/channel-sync-log.entity.ts
*/

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tenant } from '../../tenants/tenant.entity';
import { ChannelSyncType } from '../enums/channel-sync-type.enum';
import { ChannelSyncStatus } from '../enums/channel-sync-status.enum';

@Entity('channel_sync_logs')
export class ChannelSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 80 })
  channelName: string;

  @Column({
    type: 'enum',
    enum: ChannelSyncType,
  })
  type: ChannelSyncType;

  @Column({
    type: 'enum',
    enum: ChannelSyncStatus,
  })
  status: ChannelSyncStatus;

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @Column({ type: 'jsonb', nullable: true })
  response: any;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
