# L-file (Usogui Database)

## WHY
A comprehensive database for the Usogui manga series. Fans can explore characters, arcs, gambles, and community content (guides, media, annotations). Features role-based access (public/user/moderator/editor/admin), spoiler protection via reading progress tracking, and community submission workflows.

## WHAT

### Monorepo Structure
- **client/** — Next.js 15 frontend (App Router, React 19, Tailwind CSS 4, Mantine UI, React Admin)
- **server/** — NestJS backend API (TypeORM, PostgreSQL, JWT auth, Swagger)
- **docs/** — Project documentation

No root-level `package.json`; run all commands from `client/` or `server/`.

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Mantine, React Admin, Zustand, SWR
- **Backend**: NestJS 11, TypeORM, PostgreSQL, JWT authentication, Swagger
- **Auth**: Fluxer OAuth2 (primary) + Email/password (secondary) with JWT tokens
- **Storage**: Cloudflare R2 (S3-compatible, `R2_*` env vars)
- **Email**: Resend
- **Database**: PostgreSQL hosted on Supabase (use pooler, not direct connection)

### Key Domain Models
- **Core Content**: Characters, Arcs, Volumes, Chapters
- **Gambles**: Central manga theme — matches with participants, factions (GambleFaction/GambleFactionMember), outcomes, rules, and strategic explanations
- **Relationships**: Character↔Character relationships, Character↔Organization memberships
- **Community**: Users, Guides, Media, Quotes, Annotations
- **Recognition**: Badges (Ko-fi webhook), Donations, Contributions
- **Organization**: Organizations, Events, Tags, Translations
- **Infrastructure**: Edit Log (audit trail), Page Views (analytics), Tasks (background jobs)

### Authentication
- **Primary**: Fluxer OAuth2 via `passport-oauth2` (`fluxer.strategy.ts`)
- **Secondary**: Email/password via `local.strategy.ts` with bcrypt
- **JWT**: Access token (1d, in-memory on client) + refresh token in httpOnly cookie
- **Roles**: `user`, `moderator`, `editor`, `admin`
- **Admin override**: `ADMIN_FLUXER_ID` env var auto-promotes a specific Fluxer user to admin

### API
Backend: `http://localhost:3001/api` | Swagger: `http://localhost:3001/api-docs`

## HOW

### Development Setup
**Prerequisites**: Node.js 18+, Yarn (never npm), PostgreSQL or Supabase

**Environment files:**
- `server/.env` — copy from `server/.env.example`; fill in DB, JWT, Fluxer OAuth2, R2, Resend, `FRONTEND_URL`
- `client/.env.local` — `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `AUTH_RESEND_KEY`

```bash
# Install dependencies
cd client && yarn install
cd ../server && yarn install

# Terminal 1 — Backend (port 3001)
cd server && yarn start:dev

# Terminal 2 — Frontend (port 3000)
cd client && yarn dev
```

### Commands

**Server** (run from `server/`):
```bash
yarn start:dev          # Dev with hot reload
yarn start:prod         # Production (node dist/main.js)
yarn build              # Compile TypeScript
yarn lint               # ESLint
yarn db:generate        # Generate new migration
yarn db:migrate         # Run pending migrations
yarn db:migrate:dry-run # Preview migration SQL
yarn db:migrate:check   # Check for pending migrations
yarn db:status          # Show migration status
yarn db:revert          # Revert last migration
yarn db:seed            # Seed database
yarn db:backup          # Backup database
yarn db:reset           # Reset database (dev only)
```

**Client** (run from `client/`):
```bash
yarn dev                # Dev with Turbopack (port 3000)
yarn build              # Production build (runs next-sitemap postbuild)
yarn lint               # ESLint
yarn start              # Serve production build
```

### Project Conventions
- **Package Manager**: Always `yarn`, never `npm`
- **TypeScript**: Strict mode enabled on both sides
- **API Integration**: All client→server calls go through `client/src/lib/api.ts`
- **Schema Sync**: `ENABLE_SCHEMA_SYNC=true` in `server/.env` auto-syncs DB schema in dev — **never use in prod**
- **Migrations**: TypeORM datasource config is `server/typeorm.config.ts`; migration helper is `server/scripts/migration-helper.js`

### Testing Changes
1. TypeScript: `yarn build` in each directory
2. Linting: `yarn lint`
3. Run both client + server locally
4. DB changes: run `yarn db:migrate` and verify `yarn db:seed` still works
