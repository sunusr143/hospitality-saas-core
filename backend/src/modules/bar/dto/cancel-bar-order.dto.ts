/*
File Name: cancel-bar-order.dto.ts
Path: src/modules/bar/dto/cancel-bar-order.dto.ts
*/

import { IsBoolean, IsOptional } from 'class-validator';

export class CancelBarOrderDto {
  @IsOptional()
  @IsBoolean()
  reverseFolioCharge?: boolean;
}
