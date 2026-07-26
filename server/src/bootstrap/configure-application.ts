import { ValidationPipe, type INestApplication } from '@nestjs/common';

import { createValidationException } from '../shared/validation/validation-exception.factory.js';

export const API_GLOBAL_PREFIX = 'api/v1';

export function configureApplication(application: INestApplication): void {
  application.setGlobalPrefix(API_GLOBAL_PREFIX);
  application.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      whitelist: true,
      exceptionFactory: createValidationException,
    }),
  );
}
