import { DataSource } from 'typeorm';
import { Volume } from '../../entities/volume.entity';
import { Seeder } from './seeder.interface';

export class VolumeSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const volumeRepository = this.dataSource.getRepository(Volume);

    const initialVolumes = [
      {
        number: 1,
        title: 'The Lie Eater',
        description: 'Introduction to Baku Madarame and the underground gambling world',
        startChapter: 1,
        endChapter: 10,
      },
      {
        number: 2,
        title: 'The First Gamble',
        description: 'Baku faces his first serious challenge in the gambling underworld',
        startChapter: 11,
        endChapter: 20,
      },
      // Add more volumes as needed
    ];

    // Create volumes
    for (const volumeData of initialVolumes) {
      const existingVolume = await volumeRepository.findOne({
        where: { 
          number: volumeData.number,
        }
      });

      if (!existingVolume) {
        const volume = volumeRepository.create({
          number: volumeData.number,
          description: volumeData.description,
          startChapter: volumeData.startChapter,
          endChapter: volumeData.endChapter,
        });
        await volumeRepository.save(volume);
        console.log(`Created volume ${volumeData.number}: ${volumeData.title}`);
      } else {
        console.log(`Volume ${volumeData.number} already exists, skipping...`);
      }
    }

    console.log('Volume seeding completed successfully');
  }
}
