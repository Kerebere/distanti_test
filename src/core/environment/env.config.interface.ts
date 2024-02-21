export interface EnvConfig {
  STAGE: string;

  DATABASE_URL: string;

  PORT: number;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRATION_TIME: string;

  ADMIN_LOGIN: string;
  ADMIN_PASSWORD: string;

  LOGGING: boolean;

  JWT_ACCESS_EXPIRATION: string;
  NODE_ENV: 'development' | 'production' | 'test';

  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_ACCESSKEY: string;
  MINIO_SECRETKEY: string;
  MINIO_BUCKET: string;
  MINIO_USE_SSL: boolean;

  MAIL_TRANSPORT: string;
  MAIL_FROM_NAME: string;
  USE_SSL: boolean;
  USE_STARTTLS: boolean;
  USE_OAUTH: boolean;

  CORS_ALLOWED_ORIGINS: string;
}
