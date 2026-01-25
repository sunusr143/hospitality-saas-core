/*
File Name: create-room.dto.ts
Path: src/modules/rooms/dto/create-room.dto.ts
*/

import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsString()
  @IsNotEmpty()
  roomType: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsNotEmpty()
  tenantCode: string;
}
