import fs from 'fs';
import path from 'path';
import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import { Volume } from '../../entities/volume.entity';
import { Chapter } from '../../entities/chapter.entity';
import {
  Media,
  MediaType,
  MediaStatus,
  MediaPurpose,
  MediaOwnerType,
} from '../../entities/media.entity';
import { User, UserRole } from '../../entities/user.entity';

function readJson<T>(relPath: string): T {
  const p = path.resolve(__dirname, '..', 'data', relPath);
  if (!fs.existsSync(p)) return [] as unknown as T;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

export class FandomDataSeeder implements Seeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const volumeRepo = this.dataSource.getRepository(Volume);
    const chapterRepo = this.dataSource.getRepository(Chapter);
    const mediaRepo = this.dataSource.getRepository(Media);
    const userRepo = this.dataSource.getRepository(User);

    // Ensure a system/test user exists to satisfy the Media.submittedBy relation.
    // Look for an existing system user by email or username. Create one if missing.
    let systemUser = await userRepo.findOne({
      where: [{ email: 'test@example.com' }, { username: 'seed-system' }],
    });
    if (!systemUser) {
      try {
        const newUser = userRepo.create({
          username: 'seed-system',
          email: 'test@example.com',
          isEmailVerified: true,
          password: null,
          role: UserRole.USER,
          userProgress: 1,
        } as Partial<User>);
        systemUser = await userRepo.save(newUser as Partial<User>);
        console.log('Created system user seed-system <test@example.com>');
      } catch {
        console.warn(
          'Could not create system user automatically; ensure a user with email test@example.com or username seed-system exists.',
        );
      }
    }

    const chapters =
      readJson<Array<{ number: number; title?: string; summary?: string }>>(
        'chapters.json',
      );
    const volumes = readJson<
      Array<{
        number: number;
        startChapter: number;
        endChapter?: number;
        coverUrl?: string;
        description?: string;
      }>
    >('volumes.json');

    // Get existing volumes in a single query
    const existingVolumes = await volumeRepo.createQueryBuilder('v').getMany();
    const volumeMap = new Map(existingVolumes.map((v) => [v.number, v]));

    // Separate new vs existing volumes
    const newVolumes: any[] = [];
    const volumesToUpdate: any[] = [];

    for (const v of volumes) {
      const existing = volumeMap.get(v.number);
      if (!existing) {
        newVolumes.push({
          number: v.number,
          startChapter: v.startChapter,
          endChapter: v.endChapter || v.startChapter,
          description: v.description || null,
        });
      } else {
        let updated = false;
        if (existing.startChapter !== v.startChapter) {
          existing.startChapter = v.startChapter;
          updated = true;
        }
        if (v.endChapter && existing.endChapter !== v.endChapter) {
          existing.endChapter = v.endChapter;
          updated = true;
        }
        if (updated) {
          volumesToUpdate.push(existing);
        }
        // Add to map for later cover processing
        volumeMap.set(v.number, existing);
      }
    }

    // Batch insert new volumes
    if (newVolumes.length > 0) {
      console.log(`Creating ${newVolumes.length} new volumes...`);
      const savedVolumes = await volumeRepo.save(newVolumes);
      // Update map with new volumes
      for (const vol of savedVolumes) {
        volumeMap.set(vol.number, vol);
      }
    }

    // Batch update existing volumes
    if (volumesToUpdate.length > 0) {
      console.log(`Updating ${volumesToUpdate.length} volumes...`);
      await volumeRepo.save(volumesToUpdate);
    }

    // Process covers for all volumes
    console.log('Processing volume covers...');

    // Bulk-fetch all existing volume display media in a single query
    const existingDisplayMedia = await mediaRepo.find({
      where: {
        ownerType: MediaOwnerType.VOLUME,
        purpose: MediaPurpose.ENTITY_DISPLAY,
      },
    });
    const mediaByVolumeId = new Map(existingDisplayMedia.map(m => [m.ownerId, m]));

    // Resolve local cover directory once
    const localDir = path.resolve(
      __dirname, '..', '..', '..', '..', 'client', 'public', 'assets', 'volume-covers',
    );
    const localFiles = fs.existsSync(localDir) ? fs.readdirSync(localDir) : [];

    const mediaToUpdate: any[] = [];
    const mediaToCreate: any[] = [];

    for (const v of volumes) {
      const vol = volumeMap.get(v.number);
      if (!vol) continue;

      try {
        const prefix = `volume-${String(v.number).padStart(2, '0')}`;
        const matchedFile = localFiles.find(fn => fn.toLowerCase().startsWith(prefix)) || null;
        const mediaUrl = matchedFile
          ? `/assets/volume-covers/${matchedFile}`
          : v.coverUrl || null;

        if (!mediaUrl) continue;

        const existing = mediaByVolumeId.get(vol.id);
        if (existing) {
          let changed = false;
          if (existing.url !== mediaUrl) { existing.url = mediaUrl; changed = true; }
          if (matchedFile && existing.fileName !== matchedFile) { existing.fileName = matchedFile; changed = true; }
          if (matchedFile && !existing.isUploaded) { existing.isUploaded = true; changed = true; }
          if (changed) mediaToUpdate.push(existing);
        } else {
          if (!systemUser) {
            console.warn('Skipping media creation for volume cover because system user is missing.');
          } else {
            mediaToCreate.push(mediaRepo.create({
              url: mediaUrl,
              fileName: matchedFile || null,
              type: MediaType.IMAGE,
              ownerType: MediaOwnerType.VOLUME,
              ownerId: vol.id,
              status: MediaStatus.APPROVED,
              purpose: MediaPurpose.ENTITY_DISPLAY,
              isUploaded: Boolean(matchedFile),
              submittedBy: systemUser,
            } as any));
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Error attaching cover for volume ${v.number}:`, errorMessage);
      }
    }

    if (mediaToUpdate.length > 0) {
      await mediaRepo.save(mediaToUpdate);
      console.log(`Updated ${mediaToUpdate.length} volume cover records.`);
    }
    if (mediaToCreate.length > 0) {
      await mediaRepo.save(mediaToCreate);
      console.log(`Created ${mediaToCreate.length} new volume cover records.`);
    }

    // Batch insert chapters
    console.log('Processing chapters...');
    const existingChapterNumbers = new Set(
      (
        await chapterRepo.createQueryBuilder('c').select('c.number').getMany()
      ).map((c) => c.number),
    );

    const newChaptersData = chapters.filter(
      (c) => !existingChapterNumbers.has(c.number),
    );

    if (newChaptersData.length > 0) {
      console.log(
        `Creating ${newChaptersData.length} new chapters in batches...`,
      );
      const batchSize = 500;
      for (let i = 0; i < newChaptersData.length; i += batchSize) {
        const batch = newChaptersData.slice(i, i + batchSize);
        const entitiesToSave = batch.map((c) => {
          const entity = new Chapter();
          entity.number = c.number;
          if (c.title) entity.title = c.title;
          if (c.summary) entity.summary = c.summary;
          return entity;
        });
        await chapterRepo.save(entitiesToSave);
        console.log(
          `Inserted chapter batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newChaptersData.length / batchSize)}`,
        );
      }
    } else {
      console.log('All chapters already exist');
    }

    console.log('Fandom data seeding complete');
  }
}
