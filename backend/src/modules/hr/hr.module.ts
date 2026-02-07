// File Name: hr.module.ts
// Path: src/modules/hr/hr.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { Shift } from './entities/shift.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, Tenant, User])],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
