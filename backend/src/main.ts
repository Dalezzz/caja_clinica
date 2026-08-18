import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import {
  getAllowedOrigins,
  getJwtSecretOrThrow,
} from './config/security-config';

async function bootstrap() {
  const jwtSecret = getJwtSecretOrThrow();
  process.env.JWT_SECRET = jwtSecret;

  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Servidor backend escuchando en http://0.0.0.0:${port}`);
}

bootstrap();
