# L-file (Usogui Database)

## WHY
A comprehensive database dedicated to the Usogui manga series. The platform enables fans to explore character information, story arcs, gambles, and community-contributed content including guides, media galleries, and annotations. Features role-based access with public viewing, user submissions, moderator content approval, and admin management. Reading progress tracking provides spoiler protection throughout the site.

## WHAT

### Monorepo Structure
- **client/** - Next.js 15 frontend (App Router, React 19, Tailwind CSS 4, Mantine UI)
- **server/** - NestJS backend API (TypeORM, PostgreSQL, JWT auth, Swagger)
- **docs/** - Project documentation

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Mantine, React Admin
- **Backend**: NestJS, TypeORM, PostgreSQL, JWT authentication, Swagger
- **Authentication**: Fluxer OAuth2 (primary) + Email/password (secondary) with JWT tokens
- **Storage**: Backblaze B2 for media uploads
- **Email**: Resend for verification and password reset emails
- **Database**: PostgreSQL hosted on Supabase (pooler connection)

### Key Domain Models
The database centers around manga content entities:
- **Core Content**: Characters (with description and backstory fields), Arcs, Volumes, Chapters
- **Gambles**: Central theme of the manga — gambling matches with participants, factions (GambleFaction/GambleFactionMember), outcomes, rules, and strategic explanations
- **Relationships**: Character-to-character relationships, Character-to-Organization memberships with roles and timelines
- **Community**: Users (role-based), Guides (community-written), Media (fan gallery), Quotes, Annotations (user-submitted analysis)
- **Recognition**: Badges (with Ko-fi webhook integration), Donations, Contributions tracking
- **Organization**: Organizations, Events, Tags, Translations
- **Infrastructure**: Edit Log (audit trail), Page Views (analytics), Tasks (background jobs)

### Authentication
- **Primary**: Fluxer OAuth2 via `passport-oauth2` strategy (`fluxer.strategy.ts`)
- **Secondary**: Email/password via `local.strategy.ts` with bcrypt hashing
- **JWT**: Access token (1d expiry) + refresh token in httpOnly cookie
- **Roles**: `user`, `moderator`, `editor`, `admin`
- **Admin override**: `ADMIN_FLUXER_ID` env var auto-promotes a specific Fluxer user to admin

### API Structure
Backend runs on `http://localhost:3001/api` with RESTful endpoints for all entities plus authentication and file upload. Swagger UI at `http://localhost:3001/api-docs`.

## HOW

### Development Setup
**Prerequisites**: Node.js 18+, Yarn (not npm), PostgreSQL (or Supabase)

**Environment files required:**
- `server/.env` — Database, JWT, Fluxer OAuth2, B2, Resend credentials
- `client/.env.local` — `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `AUTH_RESEND_KEY`

**Starting Development:**
```bash
# Install dependencies
cd client && yarn install
cd ../server && yarn install

# Terminal 1 - Backend (port 3001)
cd server && yarn start:dev

# Terminal 2 - Frontend (port 3000)
cd client && yarn dev
```

### Essential Commands
**Server**: `yarn start:dev` (hot reload), `yarn start` (prod), `yarn build`, `yarn lint`, `yarn db:migrate`, `yarn db:seed`, `yarn db:reset` (dev only), `yarn db:backup`
**Client**: `yarn dev` (with Turbopack), `yarn build`, `yarn lint`, `yarn start` (prod)

### Project Conventions
- **Package Manager**: Always use `yarn`, never `npm`
- **Monorepo**: No root-level package.json; run commands from client/ or server/ directories
- **TypeScript**: Strict mode enabled across both client and server
- **API Integration**: Client uses [api.ts](client/src/lib/api.ts) for all backend communication
- **Schema Sync**: `ENABLE_SCHEMA_SYNC=true` in server `.env` auto-syncs DB schema in dev (do not use in prod)

### Testing Changes
1. Verify TypeScript compilation: `yarn build` in respective directory
2. Run linters: `yarn lint`
3. Test locally with both client and server running
4. For database changes: Test migrations and verify seeder still works
