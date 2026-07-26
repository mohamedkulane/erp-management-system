import 'reflect-metadata';

import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module.js';
import { configureApplication } from '../../src/bootstrap/configure-application.js';

export async function createTestApplication(
  controllers: Type<unknown>[] = [],
): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
    controllers,
  }).compile();
  const application = testingModule.createNestApplication({ logger: false });

  configureApplication(application);
  await application.init();

  return application;
}
