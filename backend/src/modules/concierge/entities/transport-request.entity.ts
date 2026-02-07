// File Name: transport-request.entity.ts
// Path: src/modules/concierge/entities/transport-request.entity.ts

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from '../../tenants/tenant.entity';
import { Guest } from '../../guests/guest.entity';

@Entity('transport_requests')
export class TransportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  tenant: Tenant;

  @ManyToOne(() => Guest, { nullable: false, onDelete: 'RESTRICT' })
  guest: Guest;

  @Column({ type: 'varchar', length: 200 })
  pickupLocation: string;

  @Column({ type: 'varchar', length: 200 })
  dropoffLocation: string;

  @Column({ type: 'timestamptz' })
  pickupAt: Date;

  @Column({ type: 'varchar', length: 40, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
