// File Name: app.service.ts
// Path: backend/src/app.service.ts

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  healthCheck(): string {
    return 'Luxury Hospitality SaaS API is running';
  }

  async readiness() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
