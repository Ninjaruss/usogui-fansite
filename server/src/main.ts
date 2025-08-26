import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { performDatabaseSafetyChecks } from './utils/db-consistency-check';

async function bootstrap() {
  // Perform database safety checks before starting the application
  await performDatabaseSafetyChecks();
  
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
    .setDescription('Comprehensive API for managing Usogui manga content, user interactions, and community features')
    .setVersion('1.0')
    .addBearerAuth()
    // Authentication & User Management
    .addTag('auth', 'Authentication - User registration, login, and verification')
    .addTag('users', 'User Management - User profiles, statistics, and account management')
    // Core Content Management
    .addTag('series', 'Series - Manga series information and metadata')
    .addTag('volumes', 'Volumes - Volume organization and chapter grouping')
    .addTag('chapters', 'Chapters - Individual chapter management')
    .addTag('arcs', 'Story Arcs - Narrative arc organization')
    // Character & Content
    .addTag('characters', 'Characters - Character profiles and information')
    .addTag('events', 'Events - Story events and timeline management')
    .addTag('factions', 'Factions - Groups and organizations')
    .addTag('quotes', 'Quotes - Character quotes and memorable lines')
    // Interactive Content
    .addTag('gambles', 'Gambles - Gambling events and game management')
    .addTag('guides', 'Guides - User-generated tutorials, strategies, and educational content')
    .addTag('media', 'Media - Community fanart, videos, and submissions')
    // Content Organization
    .addTag('tags', 'Tags - Content categorization and tagging system')
    .addTag('translations', 'Translations - Multi-language content support')
    .addTag('search', 'Search - Text search across all content with spoiler protection')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      filter: true,
    },
    customSiteTitle: 'Usogui Fansite API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0; }
      .swagger-ui .info .title { color: #3b4151; }
    `,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port} in ${process.env.NODE_ENV} mode`);
}
bootstrap();
