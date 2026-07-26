import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApplication } from '../helpers/create-test-application.js';
import type { ApiSuccessResponse } from '../../src/shared/errors/api-error.types.js';

describe('health endpoints', () => {
  let application: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    application = await createTestApplication();
    httpServer = application.getHttpServer() as Server;
  });

  afterAll(async () => {
    await application.close();
  });

  it.each([
    ['/api/v1/health/live', 'liveness'],
    ['/api/v1/health/ready', 'readiness'],
  ])('returns a standard success envelope from %s', async (path, check) => {
    const response = await request(httpServer).get(path).expect(200);

    expect(response.headers['x-correlation-id']).toEqual(expect.any(String));
    expect(response.body).toEqual({
      success: true,
      data: { check, status: 'ok' },
      meta: { correlationId: response.headers['x-correlation-id'] },
    });
  });

  it('preserves a valid client correlation ID', async () => {
    const correlationId = 'corr_client-request-123';
    const response = await request(httpServer)
      .get('/api/v1/health/live')
      .set('X-Correlation-ID', correlationId)
      .expect(200);

    const body = response.body as ApiSuccessResponse<unknown>;

    expect(response.headers['x-correlation-id']).toBe(correlationId);
    expect(body.meta.correlationId).toBe(correlationId);
  });

  it('replaces an unsafe client correlation ID', async () => {
    const response = await request(httpServer)
      .get('/api/v1/health/live')
      .set('X-Correlation-ID', 'unsafe correlation id')
      .expect(200);

    const body = response.body as ApiSuccessResponse<unknown>;

    expect(response.headers['x-correlation-id']).toMatch(/^corr_[0-9a-f-]{36}$/);
    expect(body.meta.correlationId).toBe(response.headers['x-correlation-id']);
  });
});
