// File Name: main.ts
// Path: backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

function parseCorsOrigins(value: string | undefined): true | string[] {
  if (!value || value === '*') {
    return true;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function validateCriticalConfig(): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const jwtSecret = process.env.JWT_SECRET;
  const corsOrigins = process.env.CORS_ORIGINS;
  const dbMigrationsRun = (process.env.DB_MIGRATIONS_RUN ?? 'true').toLowerCase() === 'true';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  if (nodeEnv === 'production') {
    if (jwtSecret === 'super-secret-access-token' || jwtSecret.length < 24) {
      throw new Error('JWT_SECRET is too weak for production');
    }

    if (!corsOrigins || corsOrigins === '*' || corsOrigins.trim().length === 0) {
      throw new Error('CORS_ORIGINS must be explicitly set in production');
    }

    if (!dbMigrationsRun) {
      throw new Error('DB_MIGRATIONS_RUN must be true in production');
    }
  }
}

async function bootstrap(): Promise<void> {
  validateCriticalConfig();
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // 🔐 MUST come BEFORE routes are hit
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
