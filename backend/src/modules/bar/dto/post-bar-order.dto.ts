/*
File Name: post-bar-order.dto.ts
Path: src/modules/bar/dto/post-bar-order.dto.ts
*/

import { IsUUID } from 'class-validator';

export class PostBarOrderDto {
  @IsUUID()
  folioId: string;
}
