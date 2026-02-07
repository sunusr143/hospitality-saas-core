// File Name: events.module.ts
// Path: src/modules/events/events.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Tenant])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
