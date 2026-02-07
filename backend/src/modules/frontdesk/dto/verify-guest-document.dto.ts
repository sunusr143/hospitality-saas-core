// File Name: verify-guest-document.dto.ts
// Path: src/modules/frontdesk/dto/verify-guest-document.dto.ts

import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class VerifyGuestDocumentDto {
  @IsUUID()
  guestId: string;

  @IsString()
  @MaxLength(40)
  documentType: string;

  @IsString()
  @MaxLength(80)
  documentNumber: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
