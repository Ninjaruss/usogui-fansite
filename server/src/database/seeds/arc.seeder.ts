import { DataSource } from 'typeorm';
import { Arc } from '../../entities/arc.entity';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class ArcSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const arcRepository = this.dataSource.getRepository(Arc);
    const seriesRepository = this.dataSource.getRepository(Series);

    // Get the Usogui series
    const series = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!series) {
      console.log('Series not found. Please run SeriesSeeder first.');
      return;
    }

    const initialArcs = [
      {
        name: 'Introduction Arc',
        description: 'Introduction to the world of underground gambling...',
        startChapter: 1,
        endChapter: 10,
        series: { id: series.id } as Series
      },
      {
        name: 'Life or Death Game Arc',
        description: 'Baku faces his first serious challenge...',
        startChapter: 11,
        endChapter: 20,
        series: { id: series.id } as Series
      },
      // Add more arcs as needed
    ];

    for (const arcData of initialArcs) {
      const existingArc = await arcRepository.findOne({
        where: { 
          name: arcData.name,
          series: { id: series.id }
        }
      });

      if (!existingArc) {
        await arcRepository.save(arcData);
      }
    }
  }
}
