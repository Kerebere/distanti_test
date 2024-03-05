import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './core/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3000;

  setupSwagger(app, 'DPO Academy API - Main', 'API for DPO Academy');

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const allowedOrigins = configService
    .get('CORS_ALLOWED_ORIGINS', '')
    .split(',');

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Content-Type, Authorization',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.use(cookieParser());

  app.use(helmet());

  app.enableShutdownHooks();

  await app.listen(PORT);
  Logger.log(`Application is running on port ${PORT}`);
}

bootstrap();
