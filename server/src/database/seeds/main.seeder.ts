import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import { UserSeeder } from './user.seeder';
import { ChapterSeeder } from './chapter.seeder';
import { CharacterSeeder } from './character.seeder';
import { ArcSeeder } from './arc.seeder';
import { VolumeSeeder } from './volume.seeder';
import { QuoteSeeder } from './quote.seeder';
import { EventSeeder } from './event.seeder';
import { FactionSeeder } from './faction.seeder';
import { TagSeeder } from './tag.seeder';
import { MediaSeeder } from './media.seeder';
import { GambleSeeder } from './gamble.seeder';
import { GuideSeeder } from './guide.seeder';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

export class MainSeeder {
  private readonly logger = new Logger(MainSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<boolean> {
    this.logger.log(
      chalk.blue('🌱 Starting comprehensive seeders execution...'),
    );

    const seeders: Seeder[] = [
      // Core data - must be seeded first
      new UserSeeder(this.dataSource), // Users for content attribution

      // Content structure
      new ArcSeeder(this.dataSource), // Story arcs with chapter ranges
      new VolumeSeeder(this.dataSource), // Volume organization
      new ChapterSeeder(this.dataSource), // Individual chapters

      // Characters and content
      new CharacterSeeder(this.dataSource), // Character profiles
      new FactionSeeder(this.dataSource), // Organizations and groups
      new TagSeeder(this.dataSource), // Content categorization tags

      // Interactive content
      new EventSeeder(this.dataSource), // Story events and plot points
      new QuoteSeeder(this.dataSource), // Character quotes
      new GambleSeeder(this.dataSource), // Gambling events and games
      new MediaSeeder(this.dataSource), // Community media submissions
      new GuideSeeder(this.dataSource), // User-generated guides and tutorials
    ];

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
        chalk.blue(
          '📊 Database has been populated with comprehensive test data including:',
        ),
      );
      this.logger.log(
        chalk.blue('   - User accounts (admin, moderator, regular users)'),
      );
      this.logger.log(chalk.blue('   - Complete Usogui content structure'));
      this.logger.log(chalk.blue('   - Character profiles and relationships'));
      this.logger.log(chalk.blue('   - Story events and plot points'));
      this.logger.log(chalk.blue('   - Gambling events and tournaments'));
      this.logger.log(chalk.blue('   - Character quotes and memorable lines'));
      this.logger.log(chalk.blue('   - Community media submissions'));
      this.logger.log(chalk.blue('   - User-generated guides and tutorials'));
      this.logger.log(chalk.blue('   - Content tags and categorization'));
      return true;
    } else {
      this.logger.error(
        chalk.red('❌ One or more seeders failed to complete successfully'),
      );
      return false;
    }
  }
}
