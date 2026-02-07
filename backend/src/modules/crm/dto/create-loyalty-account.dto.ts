// File Name: create-loyalty-account.dto.ts
// Path: src/modules/crm/dto/create-loyalty-account.dto.ts

import { IsUUID } from 'class-validator';

export class CreateLoyaltyAccountDto {
  @IsUUID()
  guestId: string;
}
