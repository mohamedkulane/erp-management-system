import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from './config/env.validation.js';
import { HealthModule } from './platform/health/health.module.js';
import { HttpFoundationModule } from './shared/infrastructure/http/http-foundation.module.js';
import { LoggingModule } from './shared/logging/logging.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env', '../.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    LoggingModule,
    HttpFoundationModule,
    HealthModule,
  ],
})
export class AppModule {}
