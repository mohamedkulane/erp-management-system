import type { ValidationError } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { createValidationException } from '../validation-exception.factory.js';

describe('createValidationException', () => {
  it('formats nested validation errors with stable codes', () => {
    const errors: ValidationError[] = [
      {
        property: 'customer',
        children: [
          {
            property: 'id',
            constraints: { isUUID: 'id must be a UUID' },
          },
        ],
      },
    ];

    expect(createValidationException(errors).getResponse()).toEqual({
      code: 'VALIDATION_FAILED',
      message: 'The request contains invalid data.',
      details: [
        {
          field: 'customer.id',
          code: 'INVALID_UUID',
          message: 'id must be a UUID',
        },
      ],
    });
  });
});
