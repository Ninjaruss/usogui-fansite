import { DataSource } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { Series } from '../../entities/series.entity';
import { Arc } from '../../entities/arc.entity';
import { Seeder } from './seeder.interface';

export class ChapterSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    try {
      const chapterRepository = this.dataSource.getRepository(Chapter);
      const seriesRepository = this.dataSource.getRepository(Series);
      const arcRepository = this.dataSource.getRepository(Arc);

      // Get the Usogui series
      const series = await seriesRepository.findOne({
        where: { name: 'Usogui' }
      });

      if (!series) {
        throw new Error('Series not found. Please run SeriesSeeder first.');
      }

      // Get the Introduction Arc
      const introArc = await arcRepository.findOne({
        where: { name: 'Introduction Arc' }
      });

      if (!introArc) {
        throw new Error('Introduction Arc not found. Please run ArcSeeder first.');
      }

      const initialChapters = [
        {
          number: 1,
          title: 'The Lie Eater',
          summary: 'Introduction to Baku Madarame and the world of underground gambling.',
          releaseDate: new Date('2006-05-01'),
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 2,
          title: 'First Gamble',
          summary: 'Baku takes on his first opponent in a high-stakes match.',
          releaseDate: new Date('2006-05-08'),
          series: { id: series.id },
          arc: { id: introArc.id }
        },
        {
          number: 3,
          title: 'The Rules of Engagement',
          summary: 'The complex rules of underground gambling are revealed.',
          releaseDate: new Date('2006-05-15'),
          series: { id: series.id },
          arc: { id: introArc.id }
        }
      ];

      // Create chapters
      for (const chapterData of initialChapters) {
        const existingChapter = await chapterRepository.findOne({
          where: { 
            number: chapterData.number,
            series: { id: series.id }
          }
        });

        if (!existingChapter) {
          console.log(`Creating chapter ${chapterData.number}: ${chapterData.title}`);
          await chapterRepository.save(
            chapterRepository.create(chapterData)
          );
        } else {
          console.log(`Chapter ${chapterData.number} already exists, skipping...`);
        }
      }

      console.log('Chapter seeding completed successfully');
    } catch (error) {
      console.error('Error during chapter seeding:', error);
      throw error;
    }
  }
}
