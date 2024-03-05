export interface EnvConfig {
  STAGE: string;

  DATABASE_URL: string;

  PORT: number;

  USER_JWT_ACCESS_SECRET: string;
  USER_JWT_REFRESH_SECRET: string;
  EMPLOYEE_JWT_ACCESS_SECRET: string;
  EMPLOYEE_JWT_REFRESH_SECRET: string;

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
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  MAIL_FROM: string;

  CORS_ALLOWED_ORIGINS: string;
}
