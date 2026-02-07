/*
File Name: guests.module.ts
Path: src/modules/guests/guests.module.ts
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { Guest } from './guest.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Guest, Tenant, User])],
  controllers: [GuestsController],
  providers: [GuestsService],
})
export class GuestsModule {}
