import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

import type { ApiSuccessResponse } from '../../errors/api-error.types.js';
import { createCorrelationId, getCorrelationId } from './correlation-id.js';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor<
  unknown,
  ApiSuccessResponse<unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiSuccessResponse<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          correlationId: getCorrelationId(request) ?? createCorrelationId(),
        },
      })),
    );
  }
}
