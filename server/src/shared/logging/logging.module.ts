import { Global, Module } from '@nestjs/common';

import { CorrelationContextService } from '../infrastructure/http/correlation-context.service.js';
import { StructuredLoggerService } from './structured-logger.service.js';

@Global()
@Module({
  providers: [CorrelationContextService, StructuredLoggerService],
  exports: [CorrelationContextService, StructuredLoggerService],
})
export class LoggingModule {}
