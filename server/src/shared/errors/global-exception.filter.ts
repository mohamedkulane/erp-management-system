import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CORRELATION_ID_HEADER,
  createCorrelationId,
  getCorrelationId,
} from '../infrastructure/http/correlation-id.js';
import { StructuredLoggerService } from '../logging/structured-logger.service.js';
import type { ApiErrorDetail, ApiErrorResponse } from './api-error.types.js';

interface NormalizedError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<unknown> {
  constructor(
    @Inject(StructuredLoggerService)
    private readonly logger: StructuredLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const status: HttpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = this.normalizeException(exception, status);
    const correlationId = getCorrelationId(request) ?? createCorrelationId();

    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error('http_request_failed', 'HTTP request failed.', exception, {
        correlation_id: correlationId,
        error_code: error.code,
        http_method: request.method,
        route: request.originalUrl,
        status_code: status,
      });
    }

    const body: ApiErrorResponse = {
      success: false,
      error,
      meta: { correlationId },
    };

    response.status(status).json(body);
  }

  private normalizeException(exception: unknown, status: HttpStatus): NormalizedError {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (this.isStructuredError(response)) {
        return response;
      }
    }

    return this.errorForStatus(status);
  }

  private isStructuredError(value: unknown): value is NormalizedError {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.code === 'string' && typeof candidate.message === 'string';
  }

  private errorForStatus(status: HttpStatus): NormalizedError {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return { code: 'BAD_REQUEST', message: 'The request is invalid.' };
      case HttpStatus.UNAUTHORIZED:
        return { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required.' };
      case HttpStatus.FORBIDDEN:
        return { code: 'ACCESS_DENIED', message: 'Access is denied.' };
      case HttpStatus.NOT_FOUND:
        return { code: 'ROUTE_NOT_FOUND', message: 'The requested route was not found.' };
      case HttpStatus.CONFLICT:
        return { code: 'CONFLICT', message: 'The request conflicts with the current state.' };
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return {
          code: 'BUSINESS_VALIDATION_FAILED',
          message: 'The request violates a business rule.',
        };
      case HttpStatus.SERVICE_UNAVAILABLE:
        return { code: 'SERVICE_UNAVAILABLE', message: 'The service is temporarily unavailable.' };
      default:
        return {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred.',
        };
    }
  }
}
