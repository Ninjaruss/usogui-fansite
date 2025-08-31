import { DataSource } from 'typeorm';
import { Media, MediaType, MediaStatus } from '../../entities/media.entity';
import { Character } from '../../entities/character.entity';
import { User } from '../../entities/user.entity';
import { Seeder } from './seeder.interface';

export class MediaSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const mediaRepository = this.dataSource.getRepository(Media);
    const characterRepository = this.dataSource.getRepository(Character);
    const userRepository = this.dataSource.getRepository(User);

    // Get a test user for media submissions
    const testUser = await userRepository.findOne({
      where: { email: 'test@example.com' },
    });

    if (!testUser) {
      console.log('Test user not found. Please run UserSeeder first.');
      return;
    }

    // Get characters for media associations
    const baku = await characterRepository.findOne({
      where: { name: 'Baku Madarame' },
    });

    const marco = await characterRepository.findOne({
      where: { name: 'Marco Reiji' },
    });

    const mediaItems = [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: MediaType.VIDEO,
        description:
          "Fan-made AMV showcasing Baku's most intense gambling moments",
        character: baku || undefined,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
      {
        url: 'https://www.deviantart.com/example/art/baku-madarame-fanart-123456789',
        type: MediaType.IMAGE,
        description: 'Digital artwork of Baku Madarame in his iconic pose',
        character: baku || undefined,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
      {
        url: 'https://www.pixiv.net/en/artworks/123456789',
        type: MediaType.IMAGE,
        description:
          'Character illustration of Marco during the card tournament',
        character: marco || undefined,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
      {
        url: 'https://twitter.com/example/status/123456789',
        type: MediaType.IMAGE,
        description: 'Sketch of Baku and Marco working together',
        character: baku || undefined,
        status: MediaStatus.PENDING,
        submittedBy: testUser,
      },
      {
        url: 'https://www.instagram.com/p/example123/',
        type: MediaType.IMAGE,
        description: 'Cosplay photo of Baku Madarame costume',
        character: baku || undefined,
        status: MediaStatus.PENDING,
        submittedBy: testUser,
      },
      {
        url: 'https://www.youtube.com/watch?v=example123',
        type: MediaType.VIDEO,
        description: 'Analysis video discussing Usogui gambling strategies',
        character: undefined,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
    ];

    for (const mediaData of mediaItems) {
      const existingMedia = await mediaRepository.findOne({
        where: { url: mediaData.url },
      });

      if (!existingMedia) {
        await mediaRepository.save(mediaData);
      }
    }
  }
}
