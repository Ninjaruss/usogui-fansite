# Usogui Fansite - Frontend Client

Next.js frontend application for the Usogui fansite with React Admin integration.

## Technology Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **React Admin** for admin interface
- **Zustand** for state management
- **Motion** for animations
- **Lucide React** for icons
- **SWR** for data fetching

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

## Project Structure

```
client/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel (React Admin)
│   │   ├── characters/        # Character pages
│   │   ├── arcs/              # Story arc pages
│   │   ├── guides/            # Community guides
│   │   ├── media/             # Fan media gallery
│   │   ├── gambles/           # Gamble mechanics
│   │   ├── volumes/           # Volume information
│   │   ├── chapters/          # Chapter details
│   │   ├── events/            # Story events
│   │   ├── organizations/          # Character organizations
│   │   ├── quotes/            # Character quotes
│   │   ├── users/             # User profiles
│   │   ├── auth/              # Authentication pages
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── profile/           # User profile
│   │   ├── submit-guide/      # Guide submission
│   │   ├── submit-media/      # Media submission
│   │   ├── about/             # About page
│   │   ├── disclaimer/        # Legal disclaimer
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── admin/            # Admin interface components
│   │   ├── Navigation.tsx    # Main navigation
│   │   ├── Footer.tsx        # Site footer
│   │   ├── SearchBar.tsx     # Search functionality
│   │   └── ... many more
│   ├── providers/            # Context providers
│   │   ├── AuthProvider.tsx  # Authentication context
│   │   ├── ClientProviders.tsx # Client-side providers
│   │   └── ProgressProvider.tsx # Progress tracking
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   │   ├── api.ts           # API integration
│   │   ├── theme.ts         # Theme configuration
│   │   └── utils.ts         # Utility functions
│   └── types/               # TypeScript definitions
└── public/                  # Static assets
```

## Key Features

### Public Features
- Browse characters, arcs, volumes, chapters
- View gamble information and mechanics
- Read community guides and media
- User registration and authentication
- Submit guides and media content
- Search functionality across content

### Admin Features (React Admin)
- Content management for all entities
- User role management
- Media approval/rejection
- Guide moderation
- Analytics and reporting

## API Integration

Communicates with NestJS backend at `http://localhost:3001/api`:

- **Authentication**: Login, logout, registration, Fluxer OAuth2
- **Content APIs**: Characters, arcs, guides, media, gambles, etc.
- **User Management**: Profiles, preferences, submissions
- **Admin APIs**: Full CRUD operations for all entities

## User Roles & Permissions

- **Public Users**: View content, create account, submit guides/media
- **Moderators**: Edit existing content, approve submissions
- **Admins**: Full access including user management

## Development Guidelines

### Commands to Remember
```bash
# Use yarn (not npm)
yarn dev          # Development server with Turbopack
yarn build        # Production build
yarn lint         # ESLint checking
```

### Code Style
- Use TypeScript for all new code
- Follow Next.js App Router conventions
- Use Tailwind CSS utility classes
- Implement proper error handling
- Use meaningful component names

### State Management
- Use Zustand for global state
- Custom hooks for API calls
- Handle loading and error states properly

### Routing
- Uses Next.js App Router (not Pages Router)
- Dynamic routes with `[id]` folders
- Server and client components appropriately

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Deployment

The client runs on port 3000 by default, while the backend API runs on port 3001.