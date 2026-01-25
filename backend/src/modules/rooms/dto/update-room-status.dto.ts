/*
File Name: update-room-status.dto.ts
Path: src/modules/rooms/dto/update-room-status.dto.ts
*/

import { IsEnum } from 'class-validator';
import { RoomStatus } from '../enums/room-status.enum';

export class UpdateRoomStatusDto {
  @IsEnum(RoomStatus)
  status: RoomStatus;
}
