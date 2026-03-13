import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Zorbit Admin Console Server')
    .setDescription(
      'Backend APIs for the Zorbit Admin Console including Dashboard Configurator and Demo/Training Engine.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('dashboard', 'Dashboard widget CRUD and view/designer endpoints')
    .addTag('demo-segments', 'Demo segment management (interactive + video)')
    .addTag('demo-playlists', 'User-scoped demo playlist management')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3020);

  await app.listen(port);
  console.log(`zorbit-admin-console-server listening on port ${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
}

bootstrap();
