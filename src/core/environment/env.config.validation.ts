import { EnvConfig } from './env.config.interface';
import * as Joi from 'joi';

export const validationSchema: Joi.ObjectSchema<EnvConfig> = Joi.object({
  STAGE: Joi.string().required(),

  DATABASE_URL: Joi.string().required(),

  PORT: Joi.number().required(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().required(),

  ADMIN_LOGIN: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),

  LOGGING: Joi.boolean().required(),

  JWT_ACCESS_EXPIRATION: Joi.string().required(),

  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().required(),
  MINIO_ACCESSKEY: Joi.string().required(),
  MINIO_SECRETKEY: Joi.string().required(),
  MINIO_BUCKET: Joi.string().required(),
  MINIO_USE_SSL: Joi.boolean().required(),

  MAIL_TRANSPORT: Joi.string().required(),
  MAIL_FROM_NAME: Joi.string().required(),
  USE_SSL: Joi.boolean().required(),
  USE_STARTTLS: Joi.boolean().required(),
  USE_OAUTH: Joi.boolean().required(),
  CORS_ALLOWED_ORIGINS: Joi.string().required(),
});
