import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerOptions } from './swagger.options';

export function setupSwagger(
  app: INestApplication,
  title: string,
  description: string,
): void {
  const options = createSwaggerOptions(title, description);

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api', app, document, {
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  });
}
