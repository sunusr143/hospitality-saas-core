/*
File Name: find-bar-items.dto.ts
Path: src/modules/bar/dto/find-bar-items.dto.ts
*/

import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class FindBarItemsDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  active?: 'true' | 'false';
}
