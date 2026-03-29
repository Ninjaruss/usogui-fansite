import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { performDatabaseSafetyChecks } from './utils/db-consistency-check';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { CsrfGuard } from './common/guards/csrf.guard';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Perform database safety checks before starting the application
  console.log('[Bootstrap] Starting database safety checks...');
  await performDatabaseSafetyChecks();

  console.log('[Bootstrap] Creating NestJS application...');
  const app = await NestFactory.create(AppModule);
  console.log('[Bootstrap] App created, configuring middleware...');

  // Enable graceful shutdown - ensures connections close cleanly
  app.enableShutdownHooks();

  // Set global prefix
  app.setGlobalPrefix('api');

  // Trust reverse proxy (Traefik/Nginx) — required for express-rate-limit to read X-Forwarded-For correctly
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security
  app.use(helmet());
  // Cookie parsing for refresh token cookie
  app.use(cookieParser());

  // SECURITY: Body size limits to prevent DoS via large payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:3002'];
  const rawOriginList =
    process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
  const configuredOrigins = rawOriginList
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOrigins =
    process.env.NODE_ENV === 'production'
      ? configuredOrigins
      : Array.from(new Set([...defaultDevOrigins, ...configuredOrigins]));

  if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
    console.error(
      '[CORS] FATAL: No origins configured for production. Set CORS_ALLOWED_ORIGINS or FRONTEND_URL. Rejecting all cross-origin requests.',
    );
  }

  console.log(`[CORS] Allowed origins: ${JSON.stringify(corsOrigins)}`);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.length > 0 && corsOrigins.includes(origin)) {
        callback(null, true);
      } else if (
        corsOrigins.length === 0 &&
        process.env.NODE_ENV !== 'production'
      ) {
        // Allow all only in development when no origins configured
        callback(null, true);
      } else {
        console.warn(
          `[CORS] Blocked request from origin: "${origin}". Allowed: ${JSON.stringify(corsOrigins)}`,
        );
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    // Ensure X-Total-Count is readable by browser clients (used for react-admin pagination)
    exposedHeaders: ['X-Total-Count'],
  });

  // Rate limiting
  // Behind Cloudflare + Traefik (Dokploy), req.ip resolves to Cloudflare's IP rather than the
  // real visitor IP because trust proxy 1 only accounts for one hop (Traefik).
  //
  // CF-Connecting-IP is set by Cloudflare to the real visitor IP. However, if someone
  // bypasses Cloudflare and hits the origin directly, they could spoof this header.
  // We guard against this by only trusting CF-Connecting-IP when the immediate connecting
  // IP (from the socket, before any proxy headers) belongs to Cloudflare's published ranges.
  //
  // Cloudflare IP ranges: https://www.cloudflare.com/ips/
  // These change rarely; update if Cloudflare publishes new ranges.
  const CLOUDFLARE_CIDRS = [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
  ];

  // Parse a CIDR into base address (as BigInt) and prefix length
  const parseCidr = (cidr: string): { base: bigint; bits: number } | null => {
    const [addr, prefix] = cidr.split('/');
    const bits = parseInt(prefix, 10);
    if (addr.includes(':')) {
      // IPv6
      try {
        const groups = addr.split(':');
        let expanded = '';
        const emptyIdx = groups.indexOf('');
        if (emptyIdx !== -1) {
          const fill = 8 - groups.filter(Boolean).length;
          groups.splice(emptyIdx, 1, ...Array(fill).fill('0'));
        }
        expanded = groups.map((g) => g.padStart(4, '0')).join('');
        return { base: BigInt('0x' + expanded), bits };
      } catch {
        return null;
      }
    } else {
      // IPv4
      const parts = addr.split('.').map(Number);
      if (parts.length !== 4) return null;
      const base =
        BigInt(
          (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3],
        ) & BigInt('0xFFFFFFFF');
      return { base, bits };
    }
  };

  const ipToBigInt = (ip: string): bigint | null => {
    if (ip.includes(':')) {
      try {
        const groups = ip.split(':');
        const emptyIdx = groups.indexOf('');
        if (emptyIdx !== -1) {
          const fill = 8 - groups.filter(Boolean).length;
          groups.splice(emptyIdx, 1, ...Array(fill).fill('0'));
        }
        return BigInt('0x' + groups.map((g) => g.padStart(4, '0')).join(''));
      } catch {
        return null;
      }
    } else {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4) return null;
      return (
        BigInt(
          (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3],
        ) & BigInt('0xFFFFFFFF')
      );
    }
  };

  const cfCidrs = CLOUDFLARE_CIDRS.map(parseCidr).filter(Boolean) as {
    base: bigint;
    bits: number;
  }[];

  const isCloudflareIp = (ip: string): boolean => {
    const strippedIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
    const ipInt = ipToBigInt(strippedIp);
    if (ipInt === null) return false;
    return cfCidrs.some(({ base, bits }) => {
      const isIpv6Cidr = bits > 32;
      const shift = isIpv6Cidr ? BigInt(128 - bits) : BigInt(32 - bits);
      return ipInt >> shift === base >> shift;
    });
  };

  const getRealIp = (req: any): string => {
    // Only trust CF-Connecting-IP if the request actually came from a Cloudflare IP.
    // This prevents spoofing by anyone who bypasses Cloudflare and hits the origin directly.
    const socketIp: string =
      req.socket?.remoteAddress ?? req.connection?.remoteAddress ?? '';
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string' && isCloudflareIp(socketIp)) {
      return cfIp;
    }
    return req.ip ?? socketIp ?? '0.0.0.0';
  };

  // Allow overriding via environment variables. Defaults increased to support power users browsing multiple pages.
  const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS
    ? Number(process.env.RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000; // default 15 minutes
  const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX
    ? Number(process.env.RATE_LIMIT_MAX)
    : process.env.NODE_ENV === 'production'
      ? 2000
      : 10000; // relaxed in dev to avoid blocking during active development
  console.log(
    `Rate limiter: windowMs=${RATE_LIMIT_WINDOW_MS}, max=${RATE_LIMIT_MAX}`,
  );

  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
      keyGenerator: getRealIp,
      message: 'Too many requests from this IP, please try again later',
    }),
  );

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
      keyGenerator: getRealIp,
      message: 'Too many login attempts, please try again later',
    }),
  );

  // SECURITY: Stricter rate limiting for write operations (content creation)
  // Prevents spam and abuse of media uploads and guide submissions
  const WRITE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const WRITE_RATE_LIMIT_MAX = process.env.NODE_ENV === 'production' ? 50 : 500;

  app.use(
    '/api/media/upload',
    rateLimit({
      windowMs: WRITE_RATE_LIMIT_WINDOW_MS,
      max: WRITE_RATE_LIMIT_MAX,
      keyGenerator: getRealIp,
      message: 'Too many uploads, please try again later',
    }),
  );

  app.use(
    '/api/guides',
    rateLimit({
      windowMs: WRITE_RATE_LIMIT_WINDOW_MS,
      max: WRITE_RATE_LIMIT_MAX,
      keyGenerator: getRealIp,
      message: 'Too many guide submissions, please try again later',
      // Skip rate limiting for GET requests (reading guides)
      skip: (req) => req.method === 'GET',
    }),
  );

  app.use(
    '/api/fluxer-chat/messages',
    rateLimit({
      windowMs: WRITE_RATE_LIMIT_WINDOW_MS,
      max: WRITE_RATE_LIMIT_MAX,
      keyGenerator: getRealIp,
      message: 'Too many messages, please slow down',
      skip: (req) => req.method === 'GET',
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

  // CSRF Protection Guard - validates Origin header and custom headers for state-changing requests
  const configService = app.get(ConfigService);
  app.useGlobalGuards(new CsrfGuard(configService));

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('L-file Usogui Database API')
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
    .addTag('organizations', 'Organizations - Groups and organizations')
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
    // Community Features
    .addTag('badges', 'Badges - User achievement and recognition system')
    .addTag('donations', 'Donations - Support and contributor management')
    .addTag('page-views', 'Page Views - Analytics and usage tracking')
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
    customSiteTitle: 'L-file Usogui Database API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0; }
      .swagger-ui .info .title { color: #3b4151; }
    `,
  });

  const port = process.env.PORT || 3001;
  console.log(`[Bootstrap] Calling app.listen() on port ${port}...`);
  await app.listen(port);
  console.log(
    `[Bootstrap] Server running on http://localhost:${port} in ${process.env.NODE_ENV} mode`,
  );
}
bootstrap();
