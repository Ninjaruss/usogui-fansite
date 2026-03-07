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
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

export class MainSeeder {
  private readonly logger = new Logger(MainSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  private async runTier(seeders: Seeder[], tierName: string): Promise<boolean> {
    this.logger.log(chalk.blue(`🌱 Running ${tierName} in parallel: ${seeders.map(s => s.constructor.name).join(', ')}`));
    const results = await Promise.allSettled(seeders.map(s => s.run()));
    let success = true;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const name = seeders[i].constructor.name;
      if (result.status === 'fulfilled') {
        this.logger.log(chalk.green(`✅ ${name} completed successfully`));
      } else {
        this.logger.error(chalk.red(`❌ Error in ${name}:`));
        this.logger.error(result.reason);
        success = false;
      }
    }
    return success;
  }

  public async run(): Promise<boolean> {
    this.logger.log(
      chalk.blue('🌱 Starting comprehensive seeders execution...'),
    );

    // Tier 1: No dependencies — safe to run in parallel
    const tier1: Seeder[] = [
      new BadgeSeeder(this.dataSource),
      new ArcSeeder(this.dataSource),
      new VolumeSeeder(this.dataSource),
      new CharacterSeeder(this.dataSource),
      new OrganizationSeeder(this.dataSource),
      new TagSeeder(this.dataSource),
    ];

    // Tier 2: Depend on Tier 1 — run in parallel after Tier 1 completes
    const tier2: Seeder[] = [
      new ChapterSeeder(this.dataSource),               // after VolumeSeeder
      new CharacterOrganizationSeeder(this.dataSource), // after CharacterSeeder + OrganizationSeeder
      new QuoteSeeder(this.dataSource),                 // after CharacterSeeder
    ];

    // Tier 3: Depend on Tier 2 — run in parallel after Tier 2 completes
    const tier3: Seeder[] = [
      new GambleSeeder(this.dataSource),      // after ChapterSeeder + CharacterSeeder
      new FandomDataSeeder(this.dataSource),  // after VolumeSeeder + ChapterSeeder
    ];

    let success = await this.runTier(tier1, 'Tier 1');
    if (!success) {
      this.logger.error(chalk.red('❌ Tier 1 failed, aborting remaining tiers'));
      return false;
    }

    success = await this.runTier(tier2, 'Tier 2');
    if (!success) {
      this.logger.error(chalk.red('❌ Tier 2 failed, aborting remaining tiers'));
      return false;
    }

    success = await this.runTier(tier3, 'Tier 3');

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

      return true;
    } else {
      this.logger.error(
        chalk.red('❌ One or more seeders failed to complete successfully'),
      );
      return false;
    }
  }
}
