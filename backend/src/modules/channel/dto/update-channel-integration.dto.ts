/*
File Name: update-channel-integration.dto.ts
Path: src/modules/channel/dto/update-channel-integration.dto.ts
*/

import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChannelIntegrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  channelName?: string;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
