# Database Management Guide

This document outlines the procedures and best practices for managing the database in the Usogui Fansite project.

## Key Components

1. **Database Configurations**
   - Application config: `src/config/database.config.ts`
   - TypeORM CLI config: `typeorm.config.ts`
   - Both must remain in sync for migrations to work properly

2. **Safety Measures**
   - Schema sync is disabled in production 
   - Automatic database checks run before app startup
   - Migration helper with backup capabilities
   - Consistency checks between configs

## Environment Variables

The following environment variables control database behavior:

- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` - Connection details
- `ENABLE_SCHEMA_SYNC` - Set to "true" to enable schema synchronization (dev/test only)
- `RUN_MIGRATIONS` - Set to "true" to automatically run migrations on startup
- `NODE_ENV` - Controls additional safety checks (development, test, production)

## Common Operations

### Database Migrations

Create a new migration:
```bash
yarn db:generate MyMigrationName
```

Apply pending migrations:
```bash
yarn db:migrate
```

Revert the most recent migration:
```bash
yarn db:revert
```

Backup the database:
```bash
yarn db:backup
```

### Database Seeding

Seed the database with initial data:
```bash
yarn db:seed
```

### Development Utilities

Complete database reset (development only):
```bash
yarn db:reset
```

Check database configuration consistency:
```bash
yarn db:check
```

## Best Practices

1. **Always backup before migrations**
   - Use `yarn db:backup` before any schema changes
   - Keep backup files outside of version control

2. **Avoid schema sync in production**
   - Always use migrations for production schema changes
   - Test migrations thoroughly in staging environment first
   - Keep `ENABLE_SCHEMA_SYNC` set to "false" in production

3. **Handle migration failures**
   - If a migration fails, revert to the previous state using backups
   - Fix the issue in a new migration rather than modifying the failed one
   - Test migrations with a copy of production data when possible

4. **Maintain data integrity**
   - Use transactions for complex data operations
   - Implement proper foreign key constraints and cascades
   - Validate input data before persisting to database

   ## API notes (developer)

   - List endpoints in the API return a canonical paginated JSON envelope: `{ data: T[], total: number, page: number, perPage?: number, totalPages?: number }`.
   - The backend also sets an `X-Total-Count` header for list endpoints to support clients (like react-admin) that prefer reading totals from headers. Ensure `Access-Control-Expose-Headers` includes `X-Total-Count` when calling APIs from browsers.

## Troubleshooting

If you encounter database issues:

1. Check connection parameters in `.env` file
2. Verify both database configs are in sync
3. Look for migration errors in logs
4. If needed, use `yarn db:reset` to start fresh in development

## Entity Relationships

See `docs/2025-08-21 Database Diagram.png` for a visual representation of all entity relationships in the system.
