import { DataSource } from 'typeorm';
import {
  Media,
  MediaType,
  MediaStatus,
  MediaOwnerType,
  MediaPurpose,
} from '../../entities/media.entity';
import { Character } from '../../entities/character.entity';
import { User } from '../../entities/user.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Seeder } from './seeder.interface';

export class MediaSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const mediaRepository = this.dataSource.getRepository(Media);
    const characterRepository = this.dataSource.getRepository(Character);
    const gambleRepository = this.dataSource.getRepository(Gamble);
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

    // Get gambles for media associations
    const protoporos = await gambleRepository.findOne({
      where: { name: 'Protoporos' },
    });

    const pokerTournament = await gambleRepository.findOne({
      where: { name: 'Poker Tournament' },
    });

    const mediaItems = [
      // Character media
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: MediaType.VIDEO,
        description:
          "Fan-made AMV showcasing Baku's most intense gambling moments",
        ownerType: MediaOwnerType.CHARACTER,
        ownerId: baku?.id || 1,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
      {
        url: 'https://www.deviantart.com/example/art/baku-madarame-fanart-123456789',
        type: MediaType.IMAGE,
        description: 'Digital artwork of Baku Madarame in his iconic pose',
        ownerType: MediaOwnerType.CHARACTER,
        ownerId: baku?.id || 1,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
      {
        url: 'https://www.pixiv.net/en/artworks/123456789',
        type: MediaType.IMAGE,
        description:
          'Character illustration of Marco during the card tournament',
        ownerType: MediaOwnerType.CHARACTER,
        ownerId: marco?.id || 2,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
      {
        url: 'https://twitter.com/example/status/123456789',
        type: MediaType.IMAGE,
        description: 'Sketch of Baku and Marco working together',
        ownerType: MediaOwnerType.CHARACTER,
        ownerId: baku?.id || 1,
        status: MediaStatus.PENDING,
        submittedBy: testUser,
      },
      {
        url: 'https://www.instagram.com/p/example123/',
        type: MediaType.IMAGE,
        description: 'Cosplay photo of Baku Madarame costume',
        ownerType: MediaOwnerType.CHARACTER,
        ownerId: baku?.id || 1,
        status: MediaStatus.PENDING,
        submittedBy: testUser,
      },
      // User media
      {
        url: 'https://www.youtube.com/watch?v=example123',
        type: MediaType.VIDEO,
        description: 'Analysis video discussing Usogui gambling strategies',
        ownerType: MediaOwnerType.USER,
        ownerId: testUser.id,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
      },
      // Gamble media
      {
        url: 'https://www.youtube.com/watch?v=protoporos-rules',
        type: MediaType.VIDEO,
        description: 'Detailed explanation of Protoporos rules and strategies',
        ownerType: MediaOwnerType.GAMBLE,
        ownerId: protoporos?.id || 1,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
        purpose: MediaPurpose.ENTITY_DISPLAY,
      },
      {
        url: 'https://www.deviantart.com/example/art/protoporos-game-board-789',
        type: MediaType.IMAGE,
        description: 'Detailed diagram of the Protoporos game setup',
        ownerType: MediaOwnerType.GAMBLE,
        ownerId: protoporos?.id || 1,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
        purpose: MediaPurpose.GALLERY,
      },
      {
        url: 'https://www.pixiv.net/en/artworks/poker-tournament-art',
        type: MediaType.IMAGE,
        description: 'Artistic representation of the high-stakes poker tournament',
        ownerType: MediaOwnerType.GAMBLE,
        ownerId: pokerTournament?.id || 2,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
        purpose: MediaPurpose.ENTITY_DISPLAY,
      },
      {
        url: 'https://www.youtube.com/watch?v=poker-strategies-usogui',
        type: MediaType.VIDEO,
        description: 'Analysis of poker strategies used in Usogui tournaments',
        ownerType: MediaOwnerType.GAMBLE,
        ownerId: pokerTournament?.id || 2,
        status: MediaStatus.APPROVED,
        submittedBy: testUser,
        purpose: MediaPurpose.GALLERY,
        chapterNumber: 5,
      },
      {
        url: 'https://twitter.com/fan/status/protoporos-analysis',
        type: MediaType.IMAGE,
        description: 'Fan analysis of Protoporos winning strategies',
        ownerType: MediaOwnerType.GAMBLE,
        ownerId: protoporos?.id || 1,
        status: MediaStatus.PENDING,
        submittedBy: testUser,
        purpose: MediaPurpose.GALLERY,
        chapterNumber: 1,
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
