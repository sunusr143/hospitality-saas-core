/*
File Name: channel.module.ts
Path: src/modules/channel/channel.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { ChannelSyncLog } from './entities/channel-sync-log.entity';
import { ChannelIntegration } from './entities/channel-integration.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelSyncLog, ChannelIntegration, Tenant])],
  controllers: [ChannelController],
  providers: [ChannelService],
})
export class ChannelModule {}
