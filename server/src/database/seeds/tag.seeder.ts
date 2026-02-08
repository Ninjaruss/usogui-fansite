import { DataSource } from 'typeorm';
import { Tag } from '../../entities/tag.entity';
import { Seeder } from './seeder.interface';

export class TagSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const tagRepository = this.dataSource.getRepository(Tag);

    // Streamlined tags focused on analysis types
    const tags = [
      {
        name: 'Gamble Breakdown',
        description: 'Analysis of gambling mechanics, rules, and strategies',
      },
      {
        name: 'Character Study',
        description: 'Deep dives into character psychology and motivations',
      },
      {
        name: 'Plot Analysis',
        description: 'Story structure, arcs, foreshadowing, and twists',
      },
    ];

    const existingNames = new Set(
      (
        await tagRepository.createQueryBuilder('t').select('t.name').getMany()
      ).map((t) => t.name),
    );

    const newTags = tags.filter((tag) => !existingNames.has(tag.name));

    if (newTags.length === 0) {
      console.log('All tags already exist, skipping...');
      return;
    }

    console.log(`Inserting ${newTags.length} new tags...`);
    await tagRepository.save(newTags);
    console.log(`Successfully inserted ${newTags.length} tags`);
  }
}
