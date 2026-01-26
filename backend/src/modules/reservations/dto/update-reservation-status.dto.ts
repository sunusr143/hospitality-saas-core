// File Name: update-reservation-status.dto.ts
// Path: src/modules/reservations/dto/update-reservation-status.dto.ts

import { IsEnum } from 'class-validator';
import { ReservationStatus } from '../enums/reservation-status.enum';

export class UpdateReservationStatusDto {
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
