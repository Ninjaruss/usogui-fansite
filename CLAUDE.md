# Usogui Fansite

## WHY
A comprehensive fansite dedicated to the Usogui manga series. The platform enables fans to explore character information, story arcs, gambles, and community-contributed content including guides and media galleries. Features role-based access with public viewing, moderator content approval, and admin management.

## WHAT

### Monorepo Structure
- **client/** - Next.js 15 frontend (App Router, React 19, Tailwind CSS 4, Mantine UI)
- **server/** - NestJS backend API (TypeORM, PostgreSQL, JWT auth, Swagger)
- **docs/** - Project documentation

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Mantine, React Admin
- **Backend**: NestJS, TypeORM, PostgreSQL, JWT authentication, Swagger
- **Authentication**: Discord OAuth integration with JWT tokens
- **Storage**: Backblaze B2 for media uploads
- **Database**: PostgreSQL with comprehensive manga content schema

### Key Domain Models
The database centers around manga content entities:
- **Core Content**: Characters (with description and backstory fields), Arcs, Volumes, Chapters
- **Gambles**: Central theme of the manga - gambling matches with participants, outcomes, rules, and explanations
- **Community**: Users (role-based), Guides (community-written), Media (fan gallery), Quotes
- **Organization**: Organizations, Events, Tags, Translations

### API Structure
Backend runs on `http://localhost:3001/api` with RESTful endpoints for all entities plus authentication and file upload.

## HOW

### Development Setup
**Prerequisites**: Node.js 18+, Yarn (not npm), PostgreSQL

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
**Server**: `yarn start:dev` (hot reload), `yarn db:migrate`, `yarn db:seed`
**Client**: `yarn dev` (with Turbopack), `yarn build`, `yarn lint`

### Project Conventions
- **Package Manager**: Always use `yarn`, never `npm`
- **Monorepo**: No root-level package.json; run commands from client/ or server/ directories
- **TypeScript**: Strict mode enabled across both client and server
- **API Integration**: Client uses [api.ts](client/src/lib/api.ts) for all backend communication

### Testing Changes
1. Verify TypeScript compilation: `yarn build` in respective directory
2. Run linters: `yarn lint`
3. Test locally with both client and server running
4. For database changes: Test migrations and verify seeder still works
