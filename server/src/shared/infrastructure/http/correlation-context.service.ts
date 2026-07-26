import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

interface CorrelationStore {
  correlationId: string;
}

@Injectable()
export class CorrelationContextService {
  private readonly storage = new AsyncLocalStorage<CorrelationStore>();

  getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }

  run<T>(correlationId: string, callback: () => T): T {
    return this.storage.run({ correlationId }, callback);
  }
}
