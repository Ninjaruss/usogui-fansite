import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import { ChapterSeeder } from './chapter.seeder';
import { CharacterSeeder } from './character.seeder';
import { ArcSeeder } from './arc.seeder';
import { VolumeSeeder } from './volume.seeder';
import { QuoteSeeder } from './quote.seeder';
import { OrganizationSeeder } from './organization.seeder';
import { CharacterOrganizationSeeder } from './character-organization.seeder';
import { TagSeeder } from './tag.seeder';
import { GambleSeeder } from './gamble.seeder';
import { FandomDataSeeder } from './fandom-data.seeder';
import { BadgeSeeder } from './badge.seeder';
import { AnnotationSeeder } from './annotation.seeder';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

export class MainSeeder {
  private readonly logger = new Logger(MainSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<boolean> {
    this.logger.log(
      chalk.blue('🌱 Starting comprehensive seeders execution...'),
    );

    const isProduction = process.env.NODE_ENV === 'production';

    // Granular skip controls via environment variables
    const skipAnnotations = process.env.SKIP_ANNOTATION_SEEDER === 'true';

    // Base seeders that are safe for production
    const coreSeeders: Seeder[] = [
      new BadgeSeeder(this.dataSource), // Badge system
      new ArcSeeder(this.dataSource), // Story arcs with chapter ranges
      new VolumeSeeder(this.dataSource), // Volume organization
      new ChapterSeeder(this.dataSource), // Individual chapters
      new CharacterSeeder(this.dataSource), // Character profiles
      new OrganizationSeeder(this.dataSource), // Organizations and groups
      new CharacterOrganizationSeeder(this.dataSource), // Character-organization relationships with roles
      new TagSeeder(this.dataSource), // Content categorization tags
      new QuoteSeeder(this.dataSource), // Character quotes
      new GambleSeeder(this.dataSource), // Gambling events and games
      new FandomDataSeeder(this.dataSource), // Fandom-sourced volumes/chapters and covers
    ];

    // Build test data seeders array conditionally
    const testDataSeeders: Seeder[] = [];

    if (!isProduction) {
      if (!skipAnnotations)
        testDataSeeders.push(new AnnotationSeeder(this.dataSource));
    }

    const seeders = [...coreSeeders, ...testDataSeeders];

    // Log which seeders are being skipped
    if (isProduction) {
      this.logger.log(
        chalk.yellow(
          '⚠️  Production mode detected - skipping all test data seeders',
        ),
      );
      this.logger.log(
        chalk.yellow('   Skipped: AnnotationSeeder'),
      );
    } else if (skipAnnotations) {
      this.logger.log(
        chalk.yellow('⚠️  Skipping seeders based on environment variables:'),
      );
      this.logger.log(
        chalk.yellow('   - AnnotationSeeder (SKIP_ANNOTATION_SEEDER=true)'),
      );
    }

    let success = true;

    for (const seeder of seeders) {
      const seederName = seeder.constructor.name;
      try {
        this.logger.log(chalk.blue(`🌱 Running ${seederName}...`));
        await seeder.run();
        this.logger.log(chalk.green(`✅ ${seederName} completed successfully`));
      } catch (error) {
        this.logger.error(chalk.red(`❌ Error in ${seederName}:`));
        this.logger.error(error);
        success = false;
        break;
      }
    }

    if (success) {
      this.logger.log(chalk.green('✅ All seeders completed successfully!'));
      this.logger.log(
        chalk.blue('📊 Database has been populated with content structure:'),
      );
      this.logger.log(chalk.blue('   - Complete Usogui content structure'));
      this.logger.log(chalk.blue('   - Character profiles and relationships'));
      this.logger.log(chalk.blue('   - Gambling events and tournaments'));
      this.logger.log(chalk.blue('   - Character quotes and memorable lines'));
      this.logger.log(chalk.blue('   - Badge system with supporter rewards'));
      this.logger.log(chalk.blue('   - Content tags and categorization'));

      if (!isProduction) {
        this.logger.log(
          chalk.blue('   - User-contributed annotations and explanations'),
        );
      }

      return true;
    } else {
      this.logger.error(
        chalk.red('❌ One or more seeders failed to complete successfully'),
      );
      return false;
    }
  }
}
