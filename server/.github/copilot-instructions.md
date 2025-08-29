# GitHub Copilot Instructions for Usogui Fansite Server

This document provides guidance for AI assistants working with this NestJS-based server codebase.

## Project Overview

This is a NestJS server application for the Usogui fansite, featuring:
- REST API endpoints for managing manga/anime content
- TypeORM with PostgreSQL for data persistence
- JWT-based authentication and authorization
- Role-based access control
- API documentation with Swagger
- Entity translation system supporting multiple languages

## Key Architecture Points

### 1. Module Structure
The application follows NestJS's modular architecture with feature-based modules:

Core Modules:
- `auth` - Authentication and authorization (JWT, guards, decorators)
- `users` - User management
- `chapters` - Chapter information
- `arcs` - Story arc management
- `characters` - Character information
- `events` - Event tracking
- `factions` - Group/faction management
- `tags` - Content tagging system
- `media` - Media asset handling
- `translations` - Content translation management
- `gambles` - Game/gambling event tracking (specific to Usogui content)
- `guides` - User-generated guides and tutorials (markdown content)

### 2. Database Configuration
- Uses TypeORM with PostgreSQL
- Two configuration locations:
  - Runtime: `src/config/database.config.ts` (for application)
  - Migration: `typeorm.config.ts` (for CLI operations)
- Entity files in `src/entities/` (main entities and translations)
- Migrations in `src/migrations/`
- Note: Database paths in both configs must remain in sync

### 3. Security Implementation
- JWT-based authentication using Passport (`auth` module)
- Role-based guards via `@Roles()` decorator and `RolesGuard`
- Email verification system with tokens
- Password reset flow in `auth.service.ts`
- Special handling for test users in development

## Development Workflows

### 1. Database Operations
```bash
# Generate migrations after entity changes
yarn db:generate src/migrations/MigrationName

# Run migrations
yarn db:migrate

# Revert last migration
yarn db:revert

# Seed database with test data
yarn db:seed

# Reset database (development only)
yarn db:reset

# Check database consistency
yarn db:check
```

### 2. Testing
```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

### 3. Content Translation Pattern
-The application uses a specialized translation system:
- Base entities (chapter, arc, character, etc.) contain language-agnostic data
- Translation entities in `src/entities/translations/` store language-specific content
- Follow the pattern in existing translation entities for new translatable content
- Translation module is for future Japanese language support, but default endpoints return English content
- Each translated entity extends BaseTranslation and links to its parent entity through a foreign key relationship

## Special Conventions

### 1. Route Ordering Patterns
**CRITICAL**: Always place specific routes before parameterized routes
```typescript
@Get('pending')     // Specific route FIRST
@Get(':id')        // Parameterized route AFTER
```
Example: In `media.controller.ts`, `/media/pending` must come before `/media/:id`

### 2. Authentication & Authorization Patterns
```typescript
// Public endpoints (no guards)
@Get('public')

// Authenticated endpoints (requires login)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()

// Role-restricted endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@ApiBearerAuth()
```

### 3. Controller Structure Pattern
Follow this consistent pattern across all controllers:
1. Public endpoints first (if any)
2. Authenticated endpoints second
3. Admin/moderator-only endpoints last
4. Use `@CurrentUser()` decorator to get authenticated user

### 4. Entity Relationships Pattern
- All entities include standard `createdAt` and `updatedAt` timestamps
- Main content entities (chapters, characters, etc.) link to a series
- Translation entities extend from `BaseTranslation`
- Use proper indexes for performance-critical queries
- User-related fields require `@Index(['userId'])` for performance

### 5. OpenAPI Documentation Standards
Follow comprehensive documentation patterns as seen in `guides.controller.ts`:
```typescript
@ApiOkResponse({
  description: 'Success message',
  schema: {
    type: 'object',
    properties: {
      // Detailed property examples with types and sample data
      id: { type: 'number', example: 1 },
      title: { type: 'string', example: 'Sample Title' }
    }
  }
})
@ApiBadRequestResponse({ description: 'Invalid input', schema: { example: errorObj } })
@ApiUnauthorizedResponse({ description: 'Auth required', schema: { example: errorObj } })
```

### 6. DTOs Location & Validation
- DTOs are stored in `dto/` folders within each module
- Follow consistent naming: `create-*.dto.ts`, `update-*.dto.ts`
- Use `class-validator` decorators for validation
- Import validation types properly to avoid unused imports

### 7. Service-Level Authorization
Implement authorization checks in services using UserRole enum:
```typescript
if (guide.authorId !== currentUser.id && 
    currentUser.role !== UserRole.ADMIN && 
    currentUser.role !== UserRole.MODERATOR) {
  throw new ForbiddenException('You can only edit your own guides');
}
```

## Entity Relationships

1. **Chapters**: Individual chapter records and metadata
2. **Characters**: Character profiles and associations
3. **Arcs**: Narrative arc organization, contains multiple Chapters
4. **Events**: Story events and timeline references (may reference Chapters and Characters)
5. **Factions**: Groups and organizations containing multiple Characters
7. **Tags**: Many-to-many relationships with content entities
8. **Gambles**: Complex entity specific to Usogui's gambling events
9. **Guides**: User-generated content with likes, view tracking, and tagging
10. **Users**: Central to authentication, with profile customization and content creation

## API Design Conventions

### 1. Pagination Pattern
```typescript
@Query('page') page = '1',
@Query('limit') limit = '20',
@Query('sort') sort?: string,
@Query('order') order: 'ASC' | 'DESC' = 'ASC'
```

### 2. Response Structure
```typescript
{ data: T[], total: number, page: number, totalPages: number }
```

### 3. Swagger Documentation
- Always include `@ApiTags()` for controller grouping
- Use `@ApiOperation()` for endpoint descriptions
- Include specific response decorators: `@ApiOkResponse()`, `@ApiCreatedResponse()`, etc.
- Use `@ApiBearerAuth()` for authenticated endpoints
- Add detailed examples in schema properties

### 4. Tag Descriptions
Tag descriptions are configured in `main.ts` with emojis and clear descriptions:
```typescript
.addTag('guides', '📝 Guides - User-generated tutorials, strategies, and educational content')
```

## Database Safety & Migration Patterns

### 1. Migration Safety
- Always use the migration helper: `yarn db:generate` followed by `yarn db:migrate`
- Database consistency checks run automatically on startup
- Two configs must stay synchronized: `src/config/database.config.ts` and `typeorm.config.ts`

### 2. Entity Changes
When modifying entities:
1. Update the entity file
2. Generate migration: `yarn db:generate src/migrations/DescriptiveName`
3. Review the generated migration
4. Run migration: `yarn db:migrate`

### 3. Circular Dependency Prevention
Use string-based relationships for entities that reference each other:
```typescript
@OneToMany('GuideLike', 'guide')  // String reference instead of () => GuideLike
likes: any[];
```

## Common Gotchas

1. **Route Ordering**: Specific routes (`/pending`) must come before parameterized routes (`/:id`)
2. **Database**: Always backup before migrations, test thoroughly
3. **Authentication**: Verify email verification is enabled for production users
4. **Circular Dependencies**: Use string-based entity references when needed
5. **Database Indexes**: Add indexes for foreign keys and frequently queried fields
6. **OpenAPI Examples**: Include realistic examples in all schema definitions

## Resources

- Database seed files for sample data in `src/database/seeds/`
- TypeORM migration commands in package.json scripts
- Environment validation in `src/config/env.validation.ts`
- Database diagram at `docs/2025-08-21 Database Diagram.png`
- Migration helper with backup capabilities in `scripts/migration-helper.js`
