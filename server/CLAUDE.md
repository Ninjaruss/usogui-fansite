# Usogui Fansite - Backend Server

NestJS backend API server for the Usogui fansite with comprehensive content management and authentication.

## Technology Stack

- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Full type safety
- **TypeORM** - Database ORM with PostgreSQL
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **Passport** - Authentication strategies (Fluxer OAuth2, JWT)
- **Swagger** - API documentation
- **Bcrypt** - Password hashing
- **Class Validator** - Input validation
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server with hot reload
yarn start:dev

# Build for production
yarn build

# Start production server
yarn start:prod

# Run tests
yarn test

# Database operations
yarn db:migrate    # Run migrations
yarn db:seed       # Seed database
yarn db:backup     # Backup database
yarn db:reset      # Reset database (dev only)

# Code quality
yarn lint          # ESLint
yarn format        # Prettier formatting
```

## Project Structure

```
server/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication & authorization
│   │   ├── characters/      # Character management
│   │   ├── arcs/           # Story arc management
│   │   ├── guides/         # Community guides
│   │   ├── media/          # Media gallery
│   │   ├── gambles/        # Gamble mechanics
│   │   ├── volumes/        # Volume information
│   │   ├── chapters/       # Chapter details
│   │   ├── events/         # Story events
│   │   ├── organizations/       # Character organizations
│   │   ├── quotes/         # Character quotes
│   │   ├── users/          # User management
│   │   ├── tags/           # Content tagging
│   │   ├── translations/   # Multi-language support
│   │   ├── search/         # Search functionality
│   │   ├── email/          # Email notifications
│   │   └── page-views/     # Analytics
│   ├── entities/            # TypeORM entities
│   ├── database/            # Database configuration & seeds
│   ├── common/              # Shared utilities
│   │   ├── dto/            # Data transfer objects
│   │   ├── filters/        # Exception filters
│   │   ├── interceptors/   # Request/response interceptors
│   │   └── interfaces/     # Common interfaces
│   ├── config/              # Configuration files
│   ├── services/            # External services (Backblaze B2)
│   ├── utils/               # Utility functions
│   ├── app.module.ts        # Root application module
│   └── main.ts              # Application entry point
├── scripts/                 # Database scripts
├── backups/                 # Database backups
└── test/                    # E2E tests
```

## Key Features

### Authentication & Authorization
- JWT-based authentication
- Fluxer OAuth2 integration
- Role-based access control (Public, Moderator, Admin)
- Password reset functionality
- Email verification

### Content Management
- Full CRUD operations for all content types
- File upload handling with Backblaze B2
- Image processing and validation
- Content approval workflows
- Tagging and categorization

### API Features
- RESTful API design
- Swagger documentation
- Pagination support
- Search and filtering
- Rate limiting
- CORS configuration

## Database Schema

Key entities include:

- **User**: User accounts with roles and authentication
- **Character**: Usogui characters with detailed information (includes `description` for brief intro and `backstory` for detailed history)
- **Arc**: Story arcs with chapter relationships
- **Volume/Chapter**: Manga structure
- **Gamble**: Game mechanics and rules (includes `rules`, `winCondition`, and `explanation` for in-depth analysis)
- **Event**: Story events and timeline
- **Organization**: Character groupings
- **Guide**: Community-generated guides
- **Media**: User-uploaded media content
- **Quote**: Character quotes
- **Tag**: Content categorization
- **Translations**: Multi-language support

## API Endpoints

Base URL: `http://localhost:3001/api`

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/fluxer` - Fluxer OAuth2 login
- `GET /auth/link/fluxer` - Link Fluxer account to existing user
- `POST /auth/refresh` - Token refresh

### Content Management
- `/characters` - Character CRUD
- `/arcs` - Story arc CRUD
- `/guides` - Guide CRUD with approval
- `/media` - Media CRUD with file upload
- `/gambles` - Gamble CRUD
- `/volumes` - Volume CRUD
- `/chapters` - Chapter CRUD
- `/events` - Event CRUD
- `/organizations` - Organization CRUD
- `/quotes` - Quote CRUD
- `/users` - User management (admin only)
- `/tags` - Tag management
- `/search` - Global search

## Environment Setup

Create `.env` file:
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=usogui_fansite

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Fluxer OAuth2
FLUXER_CLIENT_ID=your_fluxer_client_id
FLUXER_CLIENT_SECRET=your_fluxer_client_secret
FLUXER_CALLBACK_URL=http://localhost:3001/api/auth/fluxer/callback

# Backblaze B2
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_app_key
B2_BUCKET_NAME=your_bucket_name

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# App
NODE_ENV=development
PORT=3001
```

## Development Commands

### Database Management
```bash
yarn db:generate    # Generate new migration
yarn db:migrate     # Run pending migrations
yarn db:revert      # Revert last migration
yarn db:seed        # Seed database with initial data
yarn db:backup      # Create database backup
yarn db:check       # Check database consistency
yarn db:reset       # Reset database (development only)
```

### Code Quality
```bash
yarn lint           # Run ESLint
yarn format         # Run Prettier
yarn test           # Run unit tests
yarn test:e2e       # Run end-to-end tests
yarn test:cov       # Run tests with coverage
```

## User Roles & Permissions

- **Public**: Read access, account creation, content submission
- **Moderator**: Content editing, submission approval
- **Admin**: Full system access, user management

## Security Features

- Helmet for security headers
- CORS configuration
- Rate limiting
- Input validation with class-validator
- Password hashing with bcrypt
- JWT token expiration
- Role-based access control

## Development Guidelines

### Commands to Remember
```bash
# Always use yarn (not npm)
yarn start:dev      # Development with hot reload
yarn db:migrate     # Run database migrations after schema changes
yarn lint           # Check code quality
```

### Code Style
- Use TypeScript for all code
- Follow NestJS module structure
- Implement proper DTOs for validation
- Use decorators for authentication/authorization
- Handle errors with proper HTTP status codes

### Database
- Use TypeORM entities
- Create migrations for schema changes
- Implement proper relationships
- Use transactions for complex operations

## Deployment

Production deployment runs on port 3001 by default. Ensure proper environment variables are set and database migrations are applied.