# Usogui Database — Backend Server

NestJS backend API for the Usogui database.

## Commands

```bash
yarn start:dev          # Dev with hot reload (port 3001)
yarn start:prod         # Production (node dist/main.js)
yarn build              # Compile TypeScript
yarn lint               # ESLint
yarn format             # Prettier

# Database
yarn db:generate        # Generate new TypeORM migration
yarn db:migrate         # Run pending migrations
yarn db:migrate:dry-run # Preview migration SQL without applying
yarn db:migrate:check   # Check for pending migrations
yarn db:status          # Show migration history
yarn db:revert          # Revert last migration
yarn db:seed            # Seed database with initial data
yarn db:backup          # Create database backup
yarn db:reset           # Reset database (dev only — destructive)

# Tests
yarn test               # Unit tests
yarn test:e2e           # End-to-end tests
yarn test:cov           # Tests with coverage
```

Always use `yarn`, never `npm`.

## Project Structure

```
src/
├── modules/                  # Feature modules (NestJS pattern: module/controller/service/entity)
│   ├── auth/                 # JWT + Fluxer OAuth2 + local strategy
│   ├── users/                # User management
│   ├── characters/           # Character CRUD
│   ├── arcs/                 # Story arc CRUD
│   ├── volumes/              # Volume CRUD
│   ├── chapters/             # Chapter CRUD
│   ├── gambles/              # Gamble mechanics
│   ├── events/               # Story events
│   ├── organizations/        # Character organizations
│   ├── character-organizations/  # Character↔Organization memberships
│   ├── character-relationships/  # Character↔Character relationships
│   ├── guides/               # Community guides (with approval workflow)
│   ├── media/                # User media (with approval workflow)
│   ├── quotes/               # Character quotes
│   ├── annotations/          # User annotations
│   ├── badges/               # Badges + Ko-fi webhook
│   ├── donations/            # Donation tracking
│   ├── contributions/        # Contribution tracking
│   ├── tags/                 # Content tagging
│   ├── translations/         # Multi-language support
│   ├── search/               # Global search
│   ├── email/                # Email (Resend)
│   ├── edit-log/             # Audit trail
│   ├── page-views/           # Analytics
│   └── tasks/                # Background jobs
├── entities/                 # TypeORM entities
├── migrations/               # TypeORM migration files
├── database/                 # DB config, seeders, reset script
├── common/
│   ├── dto/                  # Shared DTOs
│   ├── filters/              # GlobalExceptionFilter
│   ├── guards/               # CsrfGuard
│   └── interceptors/         # TransformResponseInterceptor
├── config/                   # NestJS ConfigModule setup
├── services/                 # External services (Cloudflare R2)
├── data-source.ts            # TypeORM DataSource (used by migrations)
├── app.module.ts
└── main.ts
```

## Environment Setup

Copy `server/.env.example` to `server/.env`:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database (Supabase — use pooler, not direct connection)
DATABASE_HOST=aws-0-us-west-2.pooler.supabase.com
DATABASE_PORT=5432
DATABASE_USERNAME=postgres.your-project-ref
DATABASE_PASSWORD=your_password
DATABASE_NAME=postgres
DATABASE_SSL=true

# Schema sync — dev only, NEVER true in prod
ENABLE_SCHEMA_SYNC=false
RUN_MIGRATIONS=false

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=1d

# Fluxer OAuth2
FLUXER_CLIENT_ID=your_client_id
FLUXER_CLIENT_SECRET=your_client_secret
FLUXER_CALLBACK_URL=http://localhost:3001/api/auth/fluxer/callback
ADMIN_FLUXER_ID=your_fluxer_user_id

# Frontend
FRONTEND_URL=http://localhost:3000
# Production: CORS_ALLOWED_ORIGINS=https://l-file.com,https://www.l-file.com

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

## Key Patterns

### Authentication
- Fluxer OAuth2: `passport-oauth2` strategy in `src/modules/auth/strategies/fluxer.strategy.ts`
- Local: `src/modules/auth/strategies/local.strategy.ts` (bcrypt)
- OAuth callback redirects to `${FRONTEND_URL}/auth/callback?token=...&refreshToken=...`
- `ADMIN_FLUXER_ID` env var auto-promotes that Fluxer user to admin on login

### Security
- CSRF protection: `CsrfGuard` checks `X-Requested-With: Fetch` header
- Body size limit: 10mb (JSON + urlencoded)
- Rate limiting: 2000 req/15min general; 50 req/hour for auth endpoints
- `trust proxy 1` is set — required for rate limiting behind Traefik/Nginx

### Database
- TypeORM datasource config: `typeorm.config.ts` (root) and `src/data-source.ts`
- Migrations are in `src/migrations/` — always generate via `yarn db:generate`, never hand-write
- **`ENABLE_SCHEMA_SYNC=true` can drop columns** — only use in throwaway dev environments

### Content Approval
- Guides and Media have status fields (`pending`, `approved`, `rejected`)
- Moderators/admins approve via PATCH endpoints

## User Roles

| Role | Level |
|------|-------|
| `user` | Submit guides/media/annotations |
| `moderator` | Edit + approve submissions |
| `editor` | Extended content editing |
| `admin` | Full access + user management |
