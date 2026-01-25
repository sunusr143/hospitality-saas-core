// File Name: app.service.ts
// Path: backend/src/app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): string {
    return 'Luxury Hospitality SaaS API is running';
  }
}
