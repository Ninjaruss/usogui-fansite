import { Injectable } from '@nestjs/common';
import { ProfileImage } from '../../entities/profile-image.entity';
import { Character } from '../../entities/character.entity';
import { BaseSeeder } from './base.seeder';

@Injectable()
export class ProfileImageSeeder extends BaseSeeder {
  protected async seedData(queryRunner: any): Promise<void> {
    const profileImageRepo = queryRunner.manager.getRepository(ProfileImage);
    const characterRepo = queryRunner.manager.getRepository(Character);

    // Get characters for seeding
    const baku = await characterRepo.findOne({
      where: { name: 'Baku Madarame' },
    });
    const marco = await characterRepo.findOne({
      where: { name: 'Marco Reiji' },
    });
    const kaji = await characterRepo.findOne({
      where: { name: 'Kaji Takaomi' },
    });

    if (!baku || !marco || !kaji) {
      console.log('⚠️  Characters not found, skipping profile image seeding');
      return;
    }

    const profileImages = [
      // Baku Madarame images
      {
        displayName: 'Baku Madarame - Confident Smile',
        fileName: 'baku-confident-smile.webp',
        description:
          'Baku with his signature confident expression during a high-stakes gamble',
        characterId: baku.id,
        isActive: true,
        sortOrder: 1,
        tags: ['confident', 'smiling', 'formal'],
      },
      {
        displayName: 'Baku Madarame - Serious Focus',
        fileName: 'baku-serious-focus.webp',
        description: 'Baku in deep concentration, analyzing his opponent',
        characterId: baku.id,
        isActive: true,
        sortOrder: 2,
        tags: ['serious', 'focused', 'thinking'],
      },
      {
        displayName: 'Baku Madarame - Victory Pose',
        fileName: 'baku-victory-pose.webp',
        description: 'Baku celebrating after winning a difficult gamble',
        characterId: baku.id,
        isActive: true,
        sortOrder: 3,
        tags: ['victory', 'celebration', 'happy'],
      },

      // Marco Reiji images
      {
        displayName: 'Marco Reiji - Cool Composure',
        fileName: 'marco-cool-composure.webp',
        description: 'Marco maintaining his calm demeanor under pressure',
        characterId: marco.id,
        isActive: true,
        sortOrder: 1,
        tags: ['calm', 'composed', 'professional'],
      },
      {
        displayName: 'Marco Reiji - Analytical Stare',
        fileName: 'marco-analytical-stare.webp',
        description: 'Marco carefully observing and analyzing the situation',
        characterId: marco.id,
        isActive: true,
        sortOrder: 2,
        tags: ['analytical', 'observant', 'focused'],
      },

      // Kaji Takaomi images
      {
        displayName: 'Kaji Takaomi - Determined Look',
        fileName: 'kaji-determined-look.webp',
        description: 'Kaji with a determined expression, ready for action',
        characterId: kaji.id,
        isActive: true,
        sortOrder: 1,
        tags: ['determined', 'ready', 'action'],
      },
      {
        displayName: 'Kaji Takaomi - Friendly Smile',
        fileName: 'kaji-friendly-smile.webp',
        description: 'Kaji showing his more approachable side',
        characterId: kaji.id,
        isActive: true,
        sortOrder: 2,
        tags: ['friendly', 'approachable', 'smiling'],
      },
    ];

    for (const imageData of profileImages) {
      const exists = await profileImageRepo.findOne({
        where: {
          fileName: imageData.fileName,
          characterId: imageData.characterId,
        },
      });

      if (!exists) {
        const profileImage = profileImageRepo.create(imageData);
        await profileImageRepo.save(profileImage);
        console.log(`✅ Created profile image: ${imageData.displayName}`);
      }
    }

    console.log('📷 Profile image seeding completed!');
  }
}
