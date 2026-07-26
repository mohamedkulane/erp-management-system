import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { GlobalExceptionFilter } from '../../errors/global-exception.filter.js';
import { CorrelationIdMiddleware } from './correlation-id.middleware.js';
import { RequestLoggingMiddleware } from './request-logging.middleware.js';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor.js';

@Module({
  providers: [
    CorrelationIdMiddleware,
    RequestLoggingMiddleware,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class HttpFoundationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
