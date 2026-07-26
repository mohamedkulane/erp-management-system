import { randomUUID } from 'node:crypto';

import type { Request } from 'express';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';
export const CORRELATION_ID_HEADER_LOWERCASE = 'x-correlation-id';

const CORRELATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export interface CorrelatedRequest extends Request {
  correlationId: string;
}

export function createCorrelationId(): string {
  return `corr_${randomUUID()}`;
}

export function isValidCorrelationId(value: string): boolean {
  return CORRELATION_ID_PATTERN.test(value);
}

export function getCorrelationId(request: Request): string | undefined {
  return 'correlationId' in request && typeof request.correlationId === 'string'
    ? request.correlationId
    : undefined;
}
