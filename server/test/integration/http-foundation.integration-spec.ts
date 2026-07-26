import type { Server } from 'node:http';

import { Body, Controller, Get, type INestApplication, Post } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApplication } from '../helpers/create-test-application.js';
import type { ApiErrorResponse } from '../../src/shared/errors/api-error.types.js';

class ValidationProbeRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

@Controller('_test')
class FoundationProbeController {
  @Post('validation')
  validateRequest(@Body() body: ValidationProbeRequest): ValidationProbeRequest {
    return body;
  }

  @Get('unexpected-error')
  throwUnexpectedError(): never {
    throw new Error('Sensitive technical detail');
  }
}

describe('HTTP foundation', () => {
  let application: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    application = await createTestApplication([FoundationProbeController]);
    httpServer = application.getHttpServer() as Server;
  });

  afterAll(async () => {
    await application.close();
  });

  it('requires the global API prefix', async () => {
    const response = await request(httpServer).get('/health/live').expect(404);
    const body = response.body as ApiErrorResponse;

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested route was not found.',
      },
    });
    expect(body.meta.correlationId).toBe(response.headers['x-correlation-id']);
  });

  it('formats global request-validation failures', async () => {
    const response = await request(httpServer)
      .post('/api/v1/_test/validation')
      .send({ name: '', unexpected: true })
      .expect(400);
    const body = response.body as ApiErrorResponse;

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'The request contains invalid data.',
      },
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name', code: 'REQUIRED' }),
        expect.objectContaining({ field: 'unexpected', code: 'UNKNOWN_FIELD' }),
      ]),
    );
    expect(body.meta.correlationId).toBe(response.headers['x-correlation-id']);
  });

  it('sanitizes unexpected errors', async () => {
    const response = await request(httpServer).get('/api/v1/_test/unexpected-error').expect(500);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected server error occurred.',
      },
      meta: { correlationId: response.headers['x-correlation-id'] },
    });
    expect(JSON.stringify(response.body)).not.toContain('Sensitive technical detail');
  });
});
