// File Name: create-laundry-order.dto.ts
// Path: src/modules/laundry/dto/create-laundry-order.dto.ts

import { IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateLaundryOrderDto {
  @IsUUID()
  guestId: string;

  @IsString()
  @MaxLength(160)
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @MaxLength(10)
  currency: string;
}
