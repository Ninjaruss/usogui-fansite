import { DataSource } from 'typeorm';
import { Faction } from '../../entities/faction.entity';
import { Character } from '../../entities/character.entity';
import { Seeder } from './seeder.interface';

export class FactionSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const factionRepository = this.dataSource.getRepository(Faction);
    const characterRepository = this.dataSource.getRepository(Character);

    // Get characters for faction associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame' }
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji' }
    });

    const factions = [
      {
        name: 'Kakerou',
        description: 'A secret organization that oversees high-stakes gambling and illegal activities. Members are bound by strict rules and face severe consequences for betrayal.',
        characters: baku && marco ? [baku, marco] : []
      },
      {
        name: 'IDEAL',
        description: 'A powerful criminal organization that operates various illegal businesses including gambling, smuggling, and information trading.',
        characters: []
      },
      {
        name: 'Clan',
        description: 'A yakuza organization involved in underground gambling and territorial disputes with other criminal groups.',
        characters: []
      },
      {
        name: 'Independent Gamblers',
        description: 'Freelance gamblers who don\'t belong to any specific organization but participate in underground gambling events.',
        characters: []
      },
      {
        name: 'Police Force',
        description: 'Law enforcement officers who are either investigating or secretly involved in the underground gambling world.',
        characters: []
      }
    ];

    for (const factionData of factions) {
      const existingFaction = await factionRepository.findOne({
        where: { name: factionData.name }
      });

      if (!existingFaction) {
        await factionRepository.save(factionData);
      }
    }
  }
}
