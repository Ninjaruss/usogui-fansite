import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as chalk from 'chalk';

/**
 * Base seeder class with robust error handling
 */
@Injectable()
export abstract class BaseSeeder {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly dataSource: DataSource) {}

  /**
   * Main method to run the seeder
   */
  public async seed(): Promise<boolean> {
    this.logger.log(chalk.blue(`🌱 Running ${this.constructor.name}...`));

    // Create a transaction for the seeding operation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if seeder should run (e.g. data already exists)
      const shouldRun = await this.shouldSeed();

      if (!shouldRun) {
        this.logger.log(
          chalk.yellow(
            `⏭️ Skipping ${this.constructor.name} - data already exists`,
          ),
        );
        return true;
      }

      // Check dependencies
      await this.checkDependencies();

      // Run the actual seed operation
      await this.seedData(queryRunner);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        chalk.green(`✅ ${this.constructor.name} completed successfully`),
      );
      return true;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();

      this.logger.error(chalk.red(`❌ ${this.constructor.name} failed`));
      this.logger.error(error);

      // Report detailed error information
      if (error.message) {
        this.logger.error(chalk.red(`Error message: ${error.message}`));
      }

      if (error.sql) {
        this.logger.error(chalk.red(`Failed SQL: ${error.sql}`));
      }

      if (error.parameters) {
        this.logger.error(
          chalk.red(`Parameters: ${JSON.stringify(error.parameters)}`),
        );
      }

      return false;
    } finally {
      // Release queryRunner
      await queryRunner.release();
    }
  }

  /**
   * Check if the seeder should run (e.g. if data already exists)
   * Default is to always run, override in child classes
   */
  protected async shouldSeed(): Promise<boolean> {
    return true;
  }

  /**
   * Check if dependencies for this seeder are met
   * Override in child classes to add specific checks
   */
  protected async checkDependencies(): Promise<void> {
    // Default implementation does nothing
    // Override in child classes to add dependency checks
  }

  /**
   * Actual seeding logic to be implemented by child classes
   */
  protected abstract seedData(queryRunner: any): Promise<void>;
}
