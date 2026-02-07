/*
File Name: create-channel-integration.dto.ts
Path: src/modules/channel/dto/create-channel-integration.dto.ts
*/

import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelIntegrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  channelName: string;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
