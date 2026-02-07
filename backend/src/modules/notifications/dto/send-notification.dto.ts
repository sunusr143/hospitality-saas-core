// File Name: send-notification.dto.ts
// Path: src/modules/notifications/dto/send-notification.dto.ts

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @MaxLength(30)
  channel: string;

  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  body: string;
}
