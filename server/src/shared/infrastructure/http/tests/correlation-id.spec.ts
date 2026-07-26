import { describe, expect, it } from 'vitest';

import { createCorrelationId, isValidCorrelationId } from '../correlation-id.js';

describe('correlation IDs', () => {
  it('generates a valid server correlation ID', () => {
    const correlationId = createCorrelationId();

    expect(correlationId).toMatch(/^corr_[0-9a-f-]{36}$/);
    expect(isValidCorrelationId(correlationId)).toBe(true);
  });

  it.each(['', 'contains spaces', 'contains/newline\n', 'a'.repeat(129)])(
    'rejects unsafe correlation ID %j',
    (correlationId) => {
      expect(isValidCorrelationId(correlationId)).toBe(false);
    },
  );
});
