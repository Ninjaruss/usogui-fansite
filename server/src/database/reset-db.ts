import { createConnection } from 'typeorm';
import { config } from 'dotenv';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as path from 'path';

// Load environment variables
config();

/**
 * Utility to completely reset the database
 * WARNING: This will drop all tables and data!
 */
async function resetDatabase() {
  console.log(
    chalk.yellow('⚠️ WARNING: This will completely reset your database!'),
  );
  console.log(chalk.yellow('⚠️ All data will be lost!'));

  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    console.log(
      chalk.red('❌ Refusing to reset database in production environment'),
    );
    console.log(
      chalk.red(
        '❌ This operation is only allowed in development or test environments',
      ),
    );
    process.exit(1);
  }

  // Check if schema sync is enabled
  if (process.env.ENABLE_SCHEMA_SYNC !== 'true') {
    console.log(chalk.red('❌ Schema synchronization is not enabled'));
    console.log(
      chalk.red('❌ Set ENABLE_SCHEMA_SYNC=true to allow database reset'),
    );
    process.exit(1);
  }

  // Ask for confirmation
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message:
        'Are you sure you want to RESET THE DATABASE? This cannot be undone!',
      default: false,
    },
  ]);

  if (!answers.confirm) {
    console.log(chalk.blue('✋ Database reset cancelled'));
    process.exit(0);
  }

  try {
    // Connect to database
    console.log(chalk.blue('🔄 Connecting to database...'));

    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [
        path.join(__dirname, '..', 'entities', '**', '*.entity.{ts,js}'),
        path.join(
          __dirname,
          '..',
          'entities',
          'translations',
          '*.entity.{ts,js}',
        ),
      ],
      synchronize: true, // Will recreate schema
      dropSchema: true, // Will drop everything first
    });

    console.log(chalk.green('✅ Database schema has been completely reset'));

    // Close connection
    await connection.close();

    // Ask to run seeders
    const seedAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'runSeeders',
        message: 'Would you like to run seeders to populate the database?',
        default: true,
      },
    ]);

    if (seedAnswers.runSeeders) {
      console.log(chalk.blue('🌱 Running database seeders...'));

      // Run seed script using child_process
      const { execSync } = require('child_process');
      execSync('yarn db:seed', { stdio: 'inherit' });
    }

    console.log(chalk.green('✅ Database reset completed successfully'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('❌ Error resetting database:'));
    console.error(error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase().catch((error) => {
  console.error(chalk.red('❌ Error:'));
  console.error(error);
  process.exit(1);
});

// This function is called above, so we don't need to call it twice
