// File Name: spa.module.ts
// Path: src/modules/spa/spa.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SpaServiceManager } from './spa.service';
import { SpaController } from './spa.controller';
import { SpaService } from './entities/spa-service.entity';
import { SpaAppointment } from './entities/spa-appointment.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SpaService, SpaAppointment, Tenant, Guest, User])],
  controllers: [SpaController],
  providers: [SpaServiceManager],
})
export class SpaModule {}
