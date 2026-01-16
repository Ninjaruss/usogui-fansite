import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
config();

// Safety check to prevent dangerous operations in production
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    'src/entities/**/*.entity.{ts,js}',
    'src/entities/translations/*.entity.{ts,js}'
  ],
  migrations: ['src/migrations/**/*{.ts,.js}'],
  migrationsRun: process.env.RUN_MIGRATIONS === 'true',
  // Only enable synchronize in development or test environments and when ENABLE_SCHEMA_SYNC is true
  synchronize: (isDevelopment || isTest) && process.env.ENABLE_SCHEMA_SYNC === 'true',
  // Ensure schema sync is never run if migrations exist - additional safety
  migrationsTransactionMode: 'all',
  // SSL configuration for Supabase and other cloud PostgreSQL providers
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  logging: isDevelopment ? ['query', 'error'] : ['error'],
});
