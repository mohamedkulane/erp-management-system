import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { CorrelationContextService } from './correlation-context.service.js';
import {
  CORRELATION_ID_HEADER,
  CORRELATION_ID_HEADER_LOWERCASE,
  type CorrelatedRequest,
  createCorrelationId,
  isValidCorrelationId,
} from './correlation-id.js';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(CorrelationContextService)
    private readonly correlationContext: CorrelationContextService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const suppliedHeader = request.headers[CORRELATION_ID_HEADER_LOWERCASE];
    const suppliedCorrelationId = Array.isArray(suppliedHeader)
      ? suppliedHeader[0]
      : suppliedHeader;
    const correlationId =
      suppliedCorrelationId !== undefined && isValidCorrelationId(suppliedCorrelationId)
        ? suppliedCorrelationId
        : createCorrelationId();

    (request as CorrelatedRequest).correlationId = correlationId;
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    this.correlationContext.run(correlationId, next);
  }
}
