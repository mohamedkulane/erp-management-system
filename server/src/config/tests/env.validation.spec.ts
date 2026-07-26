import { describe, expect, it } from 'vitest';

import { validateEnvironment } from '../env.validation.js';

describe('validateEnvironment', () => {
  it('applies safe application defaults', () => {
    expect(validateEnvironment({})).toMatchObject({
      API_PORT: 5_000,
      LOG_LEVEL: 'info',
      NODE_ENV: 'development',
    });
  });

  it('converts a valid port and preserves scoped configuration', () => {
    expect(
      validateEnvironment({
        API_PORT: '4100',
        LOG_LEVEL: 'debug',
        NODE_ENV: 'test',
      }),
    ).toMatchObject({
      API_PORT: 4_100,
      LOG_LEVEL: 'debug',
      NODE_ENV: 'test',
    });
  });

  it('reports all invalid configuration values', () => {
    expect(() =>
      validateEnvironment({
        API_PORT: 70_000,
        LOG_LEVEL: 'verbose',
        NODE_ENV: 'invalid',
      }),
    ).toThrow(/Environment validation failed.*API_PORT.*LOG_LEVEL.*NODE_ENV/);
  });
});
