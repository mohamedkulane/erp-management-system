import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { StructuredLoggerService } from '../../logging/structured-logger.service.js';
import { getCorrelationId } from './correlation-id.js';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(StructuredLoggerService)
    private readonly logger: StructuredLoggerService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = performance.now();

    response.once('finish', () => {
      const durationMilliseconds = Number((performance.now() - startedAt).toFixed(2));

      this.logger.info('http_request_completed', 'HTTP request completed.', {
        correlation_id: getCorrelationId(request),
        duration_ms: durationMilliseconds,
        http_method: request.method,
        route: request.originalUrl,
        status_code: response.statusCode,
      });
    });

    next();
  }
}
