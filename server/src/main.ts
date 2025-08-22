import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] 
      : 'http://localhost:3000',
    credentials: true,
  });
  
  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
    }),
  );

  // Special rate limit for auth routes
  app.use('/auth', rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 login requests per hour
    message: 'Too many login attempts, please try again later',
  }));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('Usogui Fansite API')
    .setDescription('API documentation for Usogui fansite')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('characters', 'Character management')
    .addTag('chapters', 'Chapter management')
    .addTag('spoilers', 'Spoiler management')
    .addTag('series', 'Series information')
    .addTag('events', 'Event management')
    .addTag('factions', 'Faction management')
    .addTag('auth', 'Authentication')
    .addTag('users', 'User management')
    .addTag('translations', 'Content translations')
    .build();
  app.use('/auth', 
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 15, // limit each IP to 15 login attempts per 15 minutes
      message: 'Too many login attempts, please try again in 15 minutes',
    }),
  );

  // Global pipes and filters
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port} in ${process.env.NODE_ENV} mode`);
}
bootstrap();
