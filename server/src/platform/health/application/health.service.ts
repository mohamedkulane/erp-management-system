import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  check: 'liveness' | 'readiness';
  status: 'ok';
}

@Injectable()
export class HealthService {
  getLiveness(): HealthStatus {
    return { check: 'liveness', status: 'ok' };
  }

  getReadiness(): HealthStatus {
    return { check: 'readiness', status: 'ok' };
  }
}
