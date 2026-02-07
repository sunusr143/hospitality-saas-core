// File Name: spa-appointment.entity.ts
// Path: src/modules/spa/entities/spa-appointment.entity.ts

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { Guest } from '../../guests/guest.entity';
import { User } from '../../users/user.entity';
import { SpaService } from './spa-service.entity';
import { SpaAppointmentStatus } from '../enums/spa-appointment-status.enum';

@Entity('spa_appointments')
export class SpaAppointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => SpaService, { nullable: false, onDelete: 'RESTRICT' })
  service: SpaService;

  @ManyToOne(() => Guest, { nullable: false, onDelete: 'RESTRICT' })
  guest: Guest;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  staff: User | null;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ type: 'enum', enum: SpaAppointmentStatus, default: SpaAppointmentStatus.SCHEDULED })
  status: SpaAppointmentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
