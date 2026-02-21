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
    for (const v of volumes) {
      const vol = volumeMap.get(v.number);
      if (!vol) continue;

      // Attach a cover image. Prefer a local cached file under client/public/assets/volume-covers named like 'volume-01.jpg'.
      try {
        const localDir = path.resolve(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'client',
          'public',
          'assets',
          'volume-covers',
        );
        let localFile: string | null = null;
        if (fs.existsSync(localDir)) {
          const files = fs.readdirSync(localDir);
          const prefix = `volume-${String(v.number).padStart(2, '0')}`;
          const match = files.find((fn) => fn.toLowerCase().startsWith(prefix));
          if (match) localFile = match;
        }

        const mediaUrl = localFile
          ? `/assets/volume-covers/${localFile}`
          : v.coverUrl || null;

        if (mediaUrl && vol) {
          // Look for an existing entity_display media for this volume
          const existing = await mediaRepo.findOne({
            where: {
              ownerType: MediaOwnerType.VOLUME,
              ownerId: vol.id,
              purpose: MediaPurpose.ENTITY_DISPLAY,
            },
          });
          if (existing) {
            let changed = false;
            if (existing.url !== mediaUrl) {
              existing.url = mediaUrl;
              changed = true;
            }
            if (localFile && existing.fileName !== localFile) {
              existing.fileName = localFile;
              changed = true;
            }
            if (localFile && !existing.isUploaded) {
              existing.isUploaded = true;
              changed = true;
            }
            if (changed) await mediaRepo.save(existing as any);
          } else {
            if (!systemUser) {
              console.warn(
                'Skipping media creation for volume cover because system user is missing.',
              );
            } else {
              await mediaRepo.save(
                mediaRepo.create({
                  url: mediaUrl,
                  fileName: localFile || null,
                  type: MediaType.IMAGE,
                  ownerType: MediaOwnerType.VOLUME,
                  ownerId: vol.id,
                  status: MediaStatus.APPROVED,
                  purpose: MediaPurpose.ENTITY_DISPLAY,
                  isUploaded: Boolean(localFile),
                  submittedBy: systemUser,
                } as any) as any,
              );
              console.log(`Attached cover for volume ${v.number}`);
            }
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(
          `Error attaching cover for volume ${v.number}:`,
          errorMessage,
        );
      }
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
