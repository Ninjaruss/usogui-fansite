import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { performDatabaseSafetyChecks } from './utils/db-consistency-check';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  // Perform database safety checks before starting the application
  await performDatabaseSafetyChecks();

  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet());
  // Cookie parsing for refresh token cookie
  app.use(cookieParser());
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : 'http://localhost:3000',
    credentials: true,
    // Ensure X-Total-Count is readable by browser clients (used for react-admin pagination)
    exposedHeaders: ['X-Total-Count'],
  });

  // Rate limiting
  // Allow overriding via environment variables. Defaults increased to reduce accidental blocking during development.
  const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS
    ? Number(process.env.RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000; // default 15 minutes
  const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX
    ? Number(process.env.RATE_LIMIT_MAX)
    : 1000; // default 1000 requests per window
  console.log(
    `Rate limiter: windowMs=${RATE_LIMIT_WINDOW_MS}, max=${RATE_LIMIT_MAX}`,
  );

  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
      message: 'Too many requests from this IP, please try again later',
    }),
  );

  // Special rate limit for auth routes
  // Special rate limit for auth routes (keep strict defaults to protect against brute force)
  const AUTH_RATE_LIMIT_WINDOW_MS = process.env.AUTH_RATE_LIMIT_WINDOW_MS
    ? Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS)
    : 60 * 60 * 1000; // 1 hour
  // Keep strict limits in production, but relax for local development to avoid accidental blocks while testing.
  const AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX
    ? Number(process.env.AUTH_RATE_LIMIT_MAX)
    : process.env.NODE_ENV === 'production'
      ? 50
      : 1000;
  console.log(
    `Auth rate limiter: windowMs=${AUTH_RATE_LIMIT_WINDOW_MS}, max=${AUTH_RATE_LIMIT_MAX}`,
  );
  app.use(
    '/auth',
    rateLimit({
      windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
      max: AUTH_RATE_LIMIT_MAX,
      message: 'Too many login attempts, please try again later',
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  // Global response transformer: normalize list responses and set X-Total-Count header
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('Usogui Fansite API')
    .setDescription(
      'Comprehensive API for managing Usogui manga content, user interactions, and community features',
    )
    .setVersion('1.0')
    .addBearerAuth()
    // Authentication & User Management
    .addTag(
      'auth',
      'Authentication - User registration, login, and verification',
    )
    .addTag(
      'users',
      'User Management - User profiles, statistics, and account management',
    )
    // Core Content Management
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
    .addTag(
      'guides',
      'Guides - User-generated tutorials, strategies, and educational content',
    )
    .addTag('media', 'Media - Community fanart, videos, and submissions')
    // Content Organization
    .addTag('tags', 'Tags - Content categorization and tagging system')
    .addTag('translations', 'Translations - Multi-language content support')
    .addTag(
      'search',
      'Search - Text search across all content with spoiler protection',
    )
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
  console.log(
    `Server running on http://localhost:${port} in ${process.env.NODE_ENV} mode`,
  );
}
bootstrap();
