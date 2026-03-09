# Usogui Database - Claude MCP Documentation

## Project Overview

The Usogui Database is a comprehensive full-stack web application dedicated to the Japanese manga "Usogui" (Lie Eater). It serves as an unofficial database and community hub for fans to explore characters, story arcs, gambling events, quotes, and other content from the series.

### Architecture
- **Backend**: NestJS REST API with TypeORM and PostgreSQL
- **Frontend**: Next.js 15 with React 19, Material-UI, and Tailwind CSS
- **Admin Panel**: React Admin for content management
- **Database**: PostgreSQL with TypeORM migrations
- **File Storage**: Backblaze B2 cloud storage integration

## Core Features

### Content Management System
- **Characters**: Detailed character profiles with relationships and statistics
- **Story Arcs**: Narrative arc organization and chapter grouping
- **Gambles**: Comprehensive gambling event database with participants and outcomes
- **Events**: Timeline of key story events and plot points
- **Quotes**: Character quotes and memorable dialogue
- **Media**: Community-submitted images and media content
- **Guides**: User-generated analysis and insights
- **Volumes**: Manga volume organization and covers

### User Experience
- **Search**: Global search across all content types
- **Spoiler Settings**: Granular spoiler protection system
- **User Authentication**: JWT-based auth with user profiles
- **Responsive Design**: Mobile-first responsive interface
- **Progressive Loading**: Optimized content loading strategies

### Administrative Features
- **React Admin Dashboard**: Full CRUD operations for all content
- **User Management**: Profile management and statistics
- **Content Moderation**: Media approval workflows
- **Data Relationships**: Proper linking between all content types
- **Bulk Operations**: Database seeding and management tools

## Technology Stack

### Backend (NestJS)
```typescript
// Core Dependencies
- @nestjs/core ^11.0.1
- @nestjs/typeorm ^11.0.0
- @nestjs/jwt ^11.0.0
- @nestjs/passport ^11.0.5
- @nestjs/swagger ^11.2.0

// Database & ORM
- typeorm
- pg (PostgreSQL driver)
- class-validator
- class-transformer

// Security & Utils
- bcrypt ^6.0.0
- helmet ^8.1.0
- express-rate-limit ^8.0.1
```

### Frontend (Next.js)
```json
// Core Framework
- next: "15.4.6"
- react: "19.1.0"
- react-dom: "19.1.0"

// UI Components
- @mui/material: "^6.0.0"
- @mui/icons-material: "^6.0.0"
- tailwindcss: "^4"
- lucide-react: "^0.542.0"

// State & Data
- react-admin: "^5.10.2"
- zustand: "^5.0.8"
- swr: "^2.3.6"

// Utils
- motion: "^12.23.12"
- react-markdown: "^10.1.0"
- remark-gfm: "^4.0.1"
```

## Project Structure

```
/
├── server/                 # NestJS Backend API
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Authentication & authorization
│   │   │   ├── users/     # User management
│   │   │   ├── characters/ # Character profiles
│   │   │   ├── arcs/      # Story arc management
│   │   │   ├── gambles/   # Gambling events
│   │   │   ├── events/    # Story events
│   │   │   ├── quotes/    # Character quotes
│   │   │   ├── media/     # Media management
│   │   │   ├── guides/    # User guides
│   │   │   ├── search/    # Global search
│   │   │   └── ...
│   │   ├── entities/      # TypeORM database entities
│   │   ├── database/      # Seeds and utilities
│   │   ├── services/      # Shared services (B2, etc.)
│   │   └── config/        # Configuration files
│   └── scripts/           # Build and migration helpers
│
├── client/                # Next.js Frontend
│   ├── src/
│   │   ├── app/          # Next.js 13+ app router pages
│   │   │   ├── admin/    # Admin panel integration
│   │   │   ├── characters/
│   │   │   ├── arcs/
│   │   │   ├── gambles/
│   │   │   └── ...
│   │   ├── components/   # React components
│   │   │   ├── admin/    # React Admin components
│   │   │   └── ...
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and theme
│   │   ├── providers/    # Context providers
│   │   └── types/        # TypeScript definitions
│   └── public/           # Static assets
│
└── docs/                 # Documentation
    ├── DATABASE.md       # Database management guide
    └── CHANGELOG.md      # Version history
```

## Database Schema

### Core Entities

#### User Management
- **User**: User profiles, authentication, and preferences
- **ProfileImage**: User avatar management

#### Content Entities
- **Character**: Character profiles with detailed information
- **Arc**: Story arc organization and metadata
- **Chapter**: Individual chapter management
- **Volume**: Volume collections and covers
- **Gamble**: Gambling events with participants and rules
- **Event**: Timeline events and plot points
- **Quote**: Character dialogue and memorable lines
- **Media**: Community-submitted images and content
- **Guide**: User-generated analysis and guides
- **Organization**: Groups and organizations

#### Supporting Entities
- **Tag**: Content categorization system
- **PageView**: Analytics and tracking
- **GuideLike**: User engagement with guides

### Key Relationships
- Characters ↔ Gambles (many-to-many participants)
- Characters ↔ Events (many-to-many involvement)
- Characters ↔ Quotes (one-to-many attribution)
- Arcs ↔ Chapters (one-to-many organization)
- Users ↔ Guides (one-to-many authorship)
- Guides ↔ Tags (many-to-many categorization)

## API Architecture

### Authentication
- JWT-based authentication with refresh tokens
- Role-based access control (User, Moderator, Admin)
- Session management and security headers

### Endpoints Structure
```
/api/auth/*         # Authentication endpoints
/api/users/*        # User management
/api/characters/*   # Character CRUD operations
/api/arcs/*         # Story arc management
/api/gambles/*      # Gambling event operations
/api/events/*       # Event timeline management
/api/quotes/*       # Quote management
/api/media/*        # Media upload and management
/api/guides/*       # User guide operations
/api/search/*       # Global search functionality
```

### Data Transfer Objects (DTOs)
- Comprehensive input validation using class-validator
- Swagger/OpenAPI documentation generation
- Type-safe request/response handling

## Development Workflow

### Environment Setup
```bash
# Backend setup
cd server
yarn install
yarn db:migrate
yarn db:seed
yarn start:dev

# Frontend setup
cd client
yarn install
yarn dev
```

### Database Management
```bash
# Generate new migration
yarn db:generate MigrationName

# Run migrations
yarn db:migrate

# Seed database
yarn db:seed

# Reset database (development only)
yarn db:reset
```

### Key Environment Variables
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=usogui_fansite

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# File Storage
BACKBLAZE_B2_APPLICATION_KEY_ID=your-key-id
BACKBLAZE_B2_APPLICATION_KEY=your-key
BACKBLAZE_B2_BUCKET_NAME=your-bucket

# Feature Flags
ENABLE_SCHEMA_SYNC=false
RUN_MIGRATIONS=true
```

## Special Features

### Spoiler Protection System
- User-configurable spoiler settings
- Chapter-based content filtering
- Progressive content revelation

### Media Management
- Backblaze B2 cloud storage integration
- Image optimization and resizing
- Community submission workflow

### Search Functionality
- Global search across all content types
- Fuzzy matching and relevance scoring
- Type-ahead suggestions

### Admin Panel Integration
- React Admin dashboard embedded in Next.js
- Real-time content management
- Bulk operations and data import/export

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Relationship loading strategies
- Query optimization and caching

### Frontend Performance
- Next.js App Router with streaming
- Component-level code splitting
- Image optimization and lazy loading
- Progressive enhancement patterns

### Caching Strategy
- Database query result caching
- Static asset caching
- API response caching

## Security Implementation

### Backend Security
- Helmet.js for security headers
- Rate limiting and DDoS protection
- Input validation and sanitization
- CORS configuration
- SQL injection prevention via TypeORM

### Frontend Security
- XSS prevention
- CSRF protection
- Secure authentication flow
- Environment-specific configurations

## Deployment Architecture

### Production Setup
- Docker containerization support
- Environment-specific configurations
- Database migration automation
- Health check endpoints
- Logging and monitoring integration

### CI/CD Pipeline
- Automated testing and linting
- Database migration verification
- Build and deployment automation
- Environment promotion workflow

## Community Features

### User-Generated Content
- Guide submission and editing
- Media upload and sharing
- Comment and rating systems
- Content moderation workflows

### Engagement Systems
- User statistics and achievements
- Content recommendation engine
- Social features and interactions
- Gamification elements

This documentation provides a comprehensive overview of the Usogui Database project architecture, enabling efficient development, maintenance, and feature expansion while maintaining code quality and user experience standards.
