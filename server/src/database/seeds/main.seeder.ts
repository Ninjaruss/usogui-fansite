import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import { SeriesSeeder } from './series.seeder';
import { UserSeeder } from './user.seeder';
import { ChapterSeeder } from './chapter.seeder';
import { CharacterSeeder } from './character.seeder';
import { ArcSeeder } from './arc.seeder';
import { VolumeSeeder } from './volume.seeder';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

export class MainSeeder {
  private readonly logger = new Logger(MainSeeder.name);
  
  constructor(private readonly dataSource: DataSource) {}

  public async run(): Promise<boolean> {
    this.logger.log(chalk.blue('🌱 Starting seeders execution...'));
    
    const seeders: Seeder[] = [
      new UserSeeder(this.dataSource),
      new SeriesSeeder(this.dataSource),
      new ArcSeeder(this.dataSource),      // Create arcs with chapter numbers
      new VolumeSeeder(this.dataSource),   // Create volumes with chapter ranges
      new ChapterSeeder(this.dataSource),  // Create chapters with arc references
      new CharacterSeeder(this.dataSource),
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
      return true;
    } else {
      this.logger.error(chalk.red('❌ One or more seeders failed to complete successfully'));
      return false;
    }
  }
}
