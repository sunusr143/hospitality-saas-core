// File Name: concierge.module.ts
// Path: src/modules/concierge/concierge.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConciergeService } from './concierge.service';
import { ConciergeController } from './concierge.controller';
import { TransportRequest } from './entities/transport-request.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Guest } from '../guests/guest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransportRequest, Tenant, Guest])],
  controllers: [ConciergeController],
  providers: [ConciergeService],
})
export class ConciergeModule {}
