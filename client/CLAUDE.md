# Usogui Database — Frontend Client

Next.js 15 frontend for the Usogui database with React Admin integration.

## Commands

```bash
yarn dev        # Dev server with Turbopack (port 3000)
yarn build      # Production build (runs next-sitemap postbuild automatically)
yarn start      # Serve production build
yarn lint       # ESLint
```

Always use `yarn`, never `npm`.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel entry (AdminApp.tsx + page.tsx)
│   ├── annotations/        # User annotations
│   ├── arcs/               # Story arcs
│   ├── auth/               # OAuth callback (provider-agnostic)
│   ├── changelog/          # Site changelog
│   ├── chapters/           # Chapter details
│   ├── characters/         # Character pages
│   ├── events/             # Story events
│   ├── gambles/            # Gamble mechanics
│   ├── guides/             # Community guides
│   ├── login/              # Login page
│   ├── media/              # Fan media gallery
│   ├── organizations/      # Character organizations
│   ├── password-reset/     # Password reset flow
│   ├── profile/            # User profile
│   ├── quotes/             # Character quotes
│   ├── register/           # Registration
│   ├── search/             # Global search
│   ├── submit-annotation/  # Annotation submission
│   ├── submit-event/       # Event submission
│   ├── submit-guide/       # Guide submission
│   ├── submit-media/       # Media submission
│   ├── users/              # User profiles
│   ├── verify-email/       # Email verification
│   └── volumes/            # Volume information
├── components/
│   ├── admin/              # All React Admin components (Characters.tsx, Guides.tsx, etc.)
│   └── ...                 # Shared UI components
├── hooks/                  # Custom hooks (useSpoilerSettings, usePageView, usePendingCounts, etc.)
├── lib/
│   ├── api.ts              # All API calls — singleton ApiClient class
│   ├── theme.ts            # Mantine theme config
│   └── utils.ts            # Utility functions
├── providers/
│   ├── AuthProvider.tsx    # Auth context + token management
│   ├── ClientProviders.tsx # Root client-side providers
│   └── ProgressProvider.tsx # Reading progress / spoiler tracking
└── types/                  # TypeScript definitions
```

## Key Patterns

### API Client (`src/lib/api.ts`)
- Singleton `ApiClient` handles all requests
- **JWT access token stored in memory only** (not localStorage) — prevents XSS token theft
- Refresh token lives in httpOnly cookie
- Automatic token refresh on 401 with race condition guard (single shared refresh promise)
- `X-Requested-With: Fetch` header on all requests for CSRF protection

### Admin Panel
- Entry point: `src/app/admin/page.tsx` → `AdminApp.tsx`
- All resource components live in `src/components/admin/` (not `src/app/admin/`)
- Uses React Admin with custom `AdminDataProvider.ts` and `AdminAuthProvider.ts`

### Auth Flow
- OAuth callback: `/auth/callback?token=...&refreshToken=...` (provider-agnostic)
- After login, `AuthProvider` calls `api.silentRefresh()` to hydrate the in-memory token

### Reading Progress / Spoilers
- `ProgressProvider` tracks per-user chapter progress via Zustand
- Components use `useSpoilerSettings` hook to gate content display

## Environment Variables

```bash
# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
AUTH_SECRET=your_nextauth_secret
AUTH_RESEND_KEY=your_resend_api_key
```

## User Roles

| Role | Permissions |
|------|-------------|
| Public | View content |
| `user` | + Submit guides/media/annotations, favorites |
| `moderator` | + Edit content, approve submissions |
| `editor` | + Extended content editing |
| `admin` | Full access including user management |
