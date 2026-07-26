import { Inject, Injectable, Logger } from '@nestjs/common';

import { CorrelationContextService } from '../infrastructure/http/correlation-context.service.js';

type LogContext = Readonly<Record<string, unknown>>;

@Injectable()
export class StructuredLoggerService {
  private readonly logger = new Logger('ERPServer');

  constructor(
    @Inject(CorrelationContextService)
    private readonly correlationContext: CorrelationContextService,
  ) {}

  debug(event: string, message: string, context: LogContext = {}): void {
    this.logger.debug(this.createLogRecord(event, message, context));
  }

  error(event: string, message: string, error: unknown, context: LogContext = {}): void {
    this.logger.error({
      ...this.createLogRecord(event, message, context),
      error: this.serializeError(error),
    });
  }

  info(event: string, message: string, context: LogContext = {}): void {
    this.logger.log(this.createLogRecord(event, message, context));
  }

  warn(event: string, message: string, context: LogContext = {}): void {
    this.logger.warn(this.createLogRecord(event, message, context));
  }

  private createLogRecord(event: string, message: string, context: LogContext): LogContext {
    const correlationId = this.correlationContext.getCorrelationId();

    return {
      service: '@erp/server',
      event,
      message,
      ...(correlationId === undefined ? {} : { correlation_id: correlationId }),
      ...context,
    };
  }

  private serializeError(error: unknown): LogContext {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        ...(error.stack === undefined ? {} : { stack: error.stack }),
      };
    }

    return { name: 'UnknownError', message: String(error) };
  }
}
