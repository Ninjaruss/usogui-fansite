import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../config/database.config';
import chalk from 'chalk';

/**
 * Utility to check database configuration consistency
 * between TypeORM CLI config and application config
 */
export async function checkDatabaseConsistency() {
  console.log(chalk.blue('🔍 Checking database configuration consistency...'));

  // Create temporary ConfigService
  const configService = new ConfigService();

  // Get app database config
  const appDbConfig = getDatabaseConfig(configService);

  // Get TypeORM CLI config from root typeorm.config.ts
  // Note: We're dynamically importing to avoid issues with
  // TypeORM's DataSource being initialized multiple times
  let typeormConfigPath;
  try {
    typeormConfigPath = join(process.cwd(), 'typeorm.config.ts');

    // Check if file exists first
    if (!existsSync(typeormConfigPath)) {
      console.log(
        chalk.yellow(
          '⚠️ TypeORM config file not found at ' + typeormConfigPath,
        ),
      );
      return false;
    }

    const typeormConfigModule = await import(typeormConfigPath);
    const typeormCliConfig = typeormConfigModule.default;

    // Check consistency
    const issues: string[] = [];

    // Check database connection properties
    if (appDbConfig.host !== typeormCliConfig.options?.host) {
      issues.push('Database host mismatch');
    }

    if (appDbConfig.port !== typeormCliConfig.options?.port) {
      issues.push('Database port mismatch');
    }

    if (appDbConfig.username !== typeormCliConfig.options?.username) {
      issues.push('Database username mismatch');
    }

    if (appDbConfig.database !== typeormCliConfig.options?.database) {
      issues.push('Database name mismatch');
    }

    // Check entity paths (this is more complex as paths might be formatted differently)
    const appEntitiesString = JSON.stringify(appDbConfig.entities);
    const cliEntitiesString = JSON.stringify(
      typeormCliConfig.options?.entities,
    );

    if (
      !appEntitiesString.includes('entities') ||
      !cliEntitiesString.includes('entities')
    ) {
      issues.push('Entity path configuration mismatch');
    }

    // Check migration paths
    const appMigrationsString = JSON.stringify(appDbConfig.migrations);
    const cliMigrationsString = JSON.stringify(
      typeormCliConfig.options?.migrations,
    );

    if (
      !appMigrationsString.includes('migrations') ||
      !cliMigrationsString.includes('migrations')
    ) {
      issues.push('Migration path configuration mismatch');
    }

    // Report issues if any
    if (issues.length > 0) {
      console.log(
        chalk.yellow('⚠️ Database configuration inconsistencies found:'),
      );
      issues.forEach((issue) => console.log(chalk.yellow(`  - ${issue}`)));
      console.log(
        chalk.yellow(
          'Please ensure both configs match to prevent migration issues.',
        ),
      );
      return false;
    }

    console.log(chalk.green('✅ Database configuration is consistent'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Error checking database consistency:'));
    console.error(error);
    return false;
  }
}

/**
 * Check if there are any existing migrations
 */
export function checkExistingMigrations(): boolean {
  const migrationsPath = join(process.cwd(), 'src', 'migrations');

  if (!existsSync(migrationsPath)) {
    return false;
  }

  const files = readdirSync(migrationsPath);
  return files.some((file) => file.endsWith('.ts') || file.endsWith('.js'));
}

/**
 * Database safety check - to be run at application startup
 */
export async function performDatabaseSafetyChecks(): Promise<void> {
  console.log(chalk.blue('🛡️ Performing database safety checks...'));

  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log(
      chalk.blue('🧪 Test environment detected, skipping safety checks'),
    );
    return;
  }

  // Production environment checks
  if (process.env.NODE_ENV === 'production') {
    if (process.env.ENABLE_SCHEMA_SYNC === 'true') {
      console.error(
        chalk.red(
          '❌ CRITICAL RISK: Schema synchronization is enabled in production!',
        ),
      );
      console.error(
        chalk.red(
          'This could cause data loss. Please disable ENABLE_SCHEMA_SYNC in production.',
        ),
      );
      process.exit(1);
    }

    // When in production, ensure migrations exist before starting
    if (!checkExistingMigrations()) {
      console.warn(
        chalk.yellow('⚠️ No migrations found but running in production mode.'),
      );
      console.warn(
        chalk.yellow(
          'It is recommended to use migrations in production for controlled schema updates.',
        ),
      );
    }
  }

  // Run consistency check
  const isConsistent = await checkDatabaseConsistency();

  // In development, warn but don't exit
  if (!isConsistent && process.env.NODE_ENV !== 'development') {
    console.error(
      chalk.red('❌ Database configuration inconsistency detected.'),
    );
    console.error(
      chalk.red('This could lead to unexpected behavior with migrations.'),
    );

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  console.log(chalk.green('✅ Database safety checks completed'));
}
