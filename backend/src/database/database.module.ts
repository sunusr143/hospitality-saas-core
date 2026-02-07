// File Name: database.module.ts
// Path: backend/src/database/database.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<number>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        // Avoid TypeORM enum sync issues in production; use migrations instead.
        synchronize: false,
        logging: config.get<boolean>('DB_LOGGING'),
        migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
        migrationsRun: config.get<boolean>('DB_MIGRATIONS_RUN') ?? true,
        migrationsTableName: 'migrations',
      }),
    }),
  ],
})
export class DatabaseModule {}
