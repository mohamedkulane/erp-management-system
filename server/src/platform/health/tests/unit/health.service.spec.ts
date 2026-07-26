import { describe, expect, it } from 'vitest';

import { HealthService } from '../../application/health.service.js';

describe('HealthService', () => {
  const healthService = new HealthService();

  it('reports the process as live', () => {
    expect(healthService.getLiveness()).toEqual({ check: 'liveness', status: 'ok' });
  });

  it('reports the initialized application as ready', () => {
    expect(healthService.getReadiness()).toEqual({ check: 'readiness', status: 'ok' });
  });
});
