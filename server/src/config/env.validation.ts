import Joi from 'joi';

export const SUPPORTED_ENVIRONMENTS = ['development', 'test', 'production'] as const;
export const SUPPORTED_LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export type ApplicationEnvironment = (typeof SUPPORTED_ENVIRONMENTS)[number];
export type ApplicationLogLevel = (typeof SUPPORTED_LOG_LEVELS)[number];

export interface ValidatedEnvironment extends Record<string, unknown> {
  API_PORT: number;
  LOG_LEVEL: ApplicationLogLevel;
  NODE_ENV: ApplicationEnvironment;
}

const environmentSchema = Joi.object<ValidatedEnvironment>({
  API_PORT: Joi.number().integer().min(1).max(65_535).default(5_000),
  LOG_LEVEL: Joi.string()
    .valid(...SUPPORTED_LOG_LEVELS)
    .default('info'),
  NODE_ENV: Joi.string()
    .valid(...SUPPORTED_ENVIRONMENTS)
    .default('development'),
}).unknown(true);

export function validateEnvironment(configuration: Record<string, unknown>): ValidatedEnvironment {
  const validation = environmentSchema.validate(configuration, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  });

  if (validation.error !== undefined) {
    const reasons = validation.error.details.map((detail) => detail.message).join('; ');
    throw new Error(`Environment validation failed: ${reasons}`);
  }

  return validation.value;
}
