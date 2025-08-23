import { DataSource } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class CharacterSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const characterRepository = this.dataSource.getRepository(Character);
    const seriesRepository = this.dataSource.getRepository(Series);

    const series = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!series) {
      console.log('Series not found. Please run SeriesSeeder first.');
      return;
    }

    const initialCharacters = [
      {
        name: 'Baku Madarame',
        alternateNames: ['The Lie Eater', 'Mad Dog'],
        description: 'The main protagonist, known for his ability to see through deception...',
        firstAppearanceChapter: 1,
        series: { id: series.id } as Series,
        roles: ['Kakerou Member', 'Professional Gambler']
      },
      {
        name: 'Marco Reiji',
        description: 'A skilled gambler who becomes one of Baku\'s allies...',
        firstAppearanceChapter: 5,
        series: { id: series.id } as Series,
        roles: ['Gambler']
      },
      // Add more characters as needed
    ];

    for (const characterData of initialCharacters) {
      const existingCharacter = await characterRepository.findOne({
        where: { 
          name: characterData.name,
          series: { id: series.id }
        }
      });

      if (!existingCharacter) {
        await characterRepository.save(characterData);
      }
    }
  }
}
