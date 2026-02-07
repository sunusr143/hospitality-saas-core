/*
File Name: room-move.dto.ts
Path: src/modules/front-desk/dto/room-move.dto.ts
*/

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class RoomMoveDto {
  @IsUUID()
  reservationId: string;

  @IsUUID()
  toRoomId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
