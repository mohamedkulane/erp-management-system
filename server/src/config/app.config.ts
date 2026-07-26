import type { ConfigService } from '@nestjs/config';

import type {
  ApplicationEnvironment,
  ApplicationLogLevel,
  ValidatedEnvironment,
} from './env.validation.js';

export interface ApplicationConfig {
  environment: ApplicationEnvironment;
  logLevel: ApplicationLogLevel;
  port: number;
  serviceName: string;
}

export function getApplicationConfig(
  configService: ConfigService<ValidatedEnvironment, true>,
): ApplicationConfig {
  return {
    environment: configService.getOrThrow<ApplicationEnvironment>('NODE_ENV'),
    logLevel: configService.getOrThrow<ApplicationLogLevel>('LOG_LEVEL'),
    port: configService.getOrThrow<number>('API_PORT'),
    serviceName: '@erp/server',
  };
}
