// File Name: app.controller.ts
// Path: backend/src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  healthCheck(): string {
    return this.appService.healthCheck();
  }

  @Get('health/live')
  liveness() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async readiness() {
    return this.appService.readiness();
  }
}
