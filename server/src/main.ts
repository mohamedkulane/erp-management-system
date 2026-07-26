import 'reflect-metadata';

import { ConsoleLogger, type LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { configureApplication } from './bootstrap/configure-application.js';
import { getApplicationConfig } from './config/app.config.js';
import type { ApplicationLogLevel, ValidatedEnvironment } from './config/env.validation.js';

const bootstrapLogger = new ConsoleLogger('Bootstrap', {
  colors: false,
  json: true,
});

async function bootstrap(): Promise<void> {
  const application = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = application.get(ConfigService<ValidatedEnvironment, true>);
  const config = getApplicationConfig(configService);

  application.useLogger(
    new ConsoleLogger({
      colors: false,
      json: true,
      logLevels: resolveLogLevels(config.logLevel),
    }),
  );
  configureApplication(application);
  application.enableShutdownHooks();

  await application.listen(config.port, '0.0.0.0');
}

function resolveLogLevels(logLevel: ApplicationLogLevel): LogLevel[] {
  switch (logLevel) {
    case 'debug':
      return ['debug', 'log', 'warn', 'error', 'fatal'];
    case 'info':
      return ['log', 'warn', 'error', 'fatal'];
    case 'warn':
      return ['warn', 'error', 'fatal'];
    case 'error':
      return ['error', 'fatal'];
  }
}

void bootstrap().catch((error: unknown) => {
  bootstrapLogger.error({
    service: '@erp/server',
    event: 'application_bootstrap_failed',
    message: 'The backend failed to start.',
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { name: 'UnknownError', message: String(error) },
  });
  process.exitCode = 1;
});
