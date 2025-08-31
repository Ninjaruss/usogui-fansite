import { DataSource } from 'typeorm';
import { Tag } from '../../entities/tag.entity';
import { Seeder } from './seeder.interface';

export class TagSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const tagRepository = this.dataSource.getRepository(Tag);

    const tags = [
      {
        name: 'High Stakes',
        description:
          'Content involving high-stakes gambling scenarios with significant consequences',
      },
      {
        name: 'Psychological',
        description:
          'Events that focus on psychological manipulation, mind games, and mental strategy',
      },
      {
        name: 'Action',
        description:
          'Fast-paced scenes with physical confrontations or intense situations',
      },
      {
        name: 'Mystery',
        description:
          'Events involving mysteries, hidden information, or plot reveals',
      },
      {
        name: 'Character Development',
        description:
          'Scenes that significantly develop character backgrounds, motivations, or relationships',
      },
      {
        name: 'Plot Twist',
        description:
          'Unexpected turns in the story that change the direction of the narrative',
      },
      {
        name: 'Gambling',
        description: 'Scenes focused on various forms of gambling and gaming',
      },
      {
        name: 'Kakerou',
        description:
          'Content related to the Kakerou organization and its activities',
      },
      {
        name: 'Lie Detection',
        description:
          "Scenes showcasing Baku's ability to detect lies and deception",
      },
      {
        name: 'Alliance',
        description: 'Formation or development of alliances between characters',
      },
      {
        name: 'Betrayal',
        description:
          'Events involving betrayal or broken trust between characters',
      },
      {
        name: 'Strategy',
        description:
          'Scenes focusing on strategic planning and tactical thinking',
      },
      {
        name: 'Backstory',
        description: 'Revelations about character backgrounds and past events',
      },
      {
        name: 'Tournament',
        description:
          'Events related to organized gambling tournaments and competitions',
      },
      {
        name: 'Life or Death',
        description:
          'Situations where characters face life-threatening consequences',
      },
    ];

    for (const tagData of tags) {
      const existingTag = await tagRepository.findOne({
        where: { name: tagData.name },
      });

      if (!existingTag) {
        await tagRepository.save(tagData);
      }
    }
  }
}
