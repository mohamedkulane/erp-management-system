import { BadRequestException, type ValidationError } from '@nestjs/common';

import type { ApiErrorDetail } from '../errors/api-error.types.js';

const VALIDATION_CODE_BY_CONSTRAINT: Readonly<Record<string, string>> = {
  isDefined: 'REQUIRED',
  isNotEmpty: 'REQUIRED',
  isString: 'INVALID_TYPE',
  isNumber: 'INVALID_TYPE',
  isInt: 'INVALID_TYPE',
  isBoolean: 'INVALID_TYPE',
  isArray: 'INVALID_TYPE',
  isDateString: 'INVALID_DATE',
  isEnum: 'INVALID_ENUM',
  isUUID: 'INVALID_UUID',
  minLength: 'MIN_LENGTH',
  maxLength: 'MAX_LENGTH',
  arrayMinSize: 'MIN_ITEMS',
  arrayMaxSize: 'MAX_ITEMS',
  whitelistValidation: 'UNKNOWN_FIELD',
};

export function createValidationException(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    code: 'VALIDATION_FAILED',
    message: 'The request contains invalid data.',
    details: flattenValidationErrors(errors),
  });
}

function flattenValidationErrors(errors: ValidationError[], parentPath = ''): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath === '' ? error.property : `${parentPath}.${error.property}`;
    const ownDetails =
      error.constraints === undefined
        ? []
        : Object.entries(error.constraints).map(([constraint, message]) => ({
            field,
            code: VALIDATION_CODE_BY_CONSTRAINT[constraint] ?? 'INVALID_VALUE',
            message,
          }));

    return [...ownDetails, ...flattenValidationErrors(error.children ?? [], field)];
  });
}
