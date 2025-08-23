import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { MainSeeder } from './seeds/main.seeder';
import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../config/database.config';

async function runSeed() {
  // Load environment variables
  config();

  // Create config service for database configuration
  const configService = new ConfigService();

  // Create a new data source
  const dataSource = new DataSource(getDatabaseConfig(configService));

  try {
    // Initialize the data source
    await dataSource.initialize();
    console.log('Connected to database.');

    // Run the main seeder
    const seeder = new MainSeeder(dataSource);
    await seeder.run();
    console.log('Database seeding completed successfully.');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    // Close the connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run the seeder
runSeed()
  .then(() => {
    console.log('Finished seeding');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error while seeding:', error);
    process.exit(1);
  });
