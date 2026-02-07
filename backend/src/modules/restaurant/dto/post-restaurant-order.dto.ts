/*
File Name: post-restaurant-order.dto.ts
Path: src/modules/restaurant/dto/post-restaurant-order.dto.ts
*/

import { IsUUID } from 'class-validator';

export class PostRestaurantOrderDto {
  @IsUUID()
  folioId: string;
}
