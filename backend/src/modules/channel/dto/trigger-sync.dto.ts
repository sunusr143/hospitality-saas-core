/*
File Name: trigger-sync.dto.ts
Path: src/modules/channel/dto/trigger-sync.dto.ts
*/

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ChannelSyncType } from '../enums/channel-sync-type.enum';

export class TriggerSyncDto {
  @IsString()
  @IsNotEmpty()
  channelName: string;

  @IsEnum(ChannelSyncType)
  type: ChannelSyncType;

  @IsOptional()
  payload?: any;
}
