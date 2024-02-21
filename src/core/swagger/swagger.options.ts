import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerOptions(title: string, description: string) {
  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion('1.0')
    .addBearerAuth({
      description: 'Please enter JWT token as: Bearer <JWT>',
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      type: 'http',
      in: 'Header',
    })
    .build();
}
