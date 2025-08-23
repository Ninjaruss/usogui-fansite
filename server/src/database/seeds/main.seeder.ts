import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import { SeriesSeeder } from './series.seeder';
import { UserSeeder } from './user.seeder';
import { ChapterSeeder } from './chapter.seeder';
import { CharacterSeeder } from './character.seeder';
import { ArcSeeder } from './arc.seeder';

export class MainSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('Starting seeding...');
    
    const seeders: Seeder[] = [
      new UserSeeder(this.dataSource),
      new SeriesSeeder(this.dataSource),
      new ArcSeeder(this.dataSource),
      new ChapterSeeder(this.dataSource),
      new CharacterSeeder(this.dataSource),
    ];

    try {
      for (const seeder of seeders) {
        const seederName = seeder.constructor.name;
        console.log(`Running ${seederName}...`);
        await seeder.run();
        console.log(`✓ ${seederName} completed`);
      }
      console.log('All seeders completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
      throw error;
    }
  }
}
