import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { MainSeeder } from './seeds/main.seeder';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../config/database.config';
import chalk from 'chalk';

async function runSeed() {
  // Load environment variables
  config();

  console.log(chalk.blue('🌱 Starting database seeding process...'));

  // Create config service for database configuration
  const configService = new ConfigService();
  const dbConfig = getDatabaseConfig(configService) as any;

  // Create a new data source
  const dataSource = new DataSource(dbConfig);

  try {
    // Initialize the data source
    await dataSource.initialize();
    console.log(chalk.green('✅ Connected to database.'));

    // Run the main seeder
    const seeder = new MainSeeder(dataSource);
    await seeder.run();
    console.log(chalk.green('✅ Database seeding completed successfully.'));

  } catch (error) {
    console.error(chalk.red('❌ Error during seeding:'));
    console.error(error);
    process.exit(1);
  } finally {
    // Close the connection
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log(chalk.blue('🔄 Database connection closed.'));
    }
  }
}

// Run the seeder
runSeed()
  .then(() => {
    console.log(chalk.green('✅ Finished seeding'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('❌ Error while seeding:'), error);
    process.exit(1);
  });
