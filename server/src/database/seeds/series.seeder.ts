import { DataSource } from 'typeorm';
import { Series } from '../../entities/series.entity';
import { Seeder } from './seeder.interface';

export class SeriesSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const seriesRepository = this.dataSource.getRepository(Series);

    // Check if series already exists
    const existingSeries = await seriesRepository.findOne({
      where: { name: 'Usogui' }
    });

    if (!existingSeries) {
      await seriesRepository.save({
        name: 'Usogui',
        description: 'In a world where gambling is life...',
        startYear: 2006,
        endYear: 2017,
        status: 'COMPLETED',
        totalChapters: 539,
        author: 'Toshio Sako',
        publisher: 'Young Jump Comics',
        demographic: 'Seinen'
      });
    }
  }
}
