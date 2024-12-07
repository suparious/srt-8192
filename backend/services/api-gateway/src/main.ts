import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { setupTelemetry } from './telemetry';

async function bootstrap() {
  // Setup OpenTelemetry
  await setupTelemetry();

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Setup validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Setup WebSocket adapter with custom options
  app.useWebSocketAdapter(new IoAdapter(app));

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('8192 API Gateway')
    .setDescription('The 8192 game API gateway documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start the server
  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`API Gateway is running on port ${port}`);
}

bootstrap();