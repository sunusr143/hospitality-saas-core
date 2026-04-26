// File Name: tenants.module.ts
// Path: backend/src/modules/tenants/tenants.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantsService } from './tenants.service';
import { PublicTenantsController, TenantsController } from './tenants.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), UsersModule],
  providers: [TenantsService],
  controllers: [TenantsController, PublicTenantsController],
})
export class TenantsModule {}
