/**
 * Seeds cover images and showcase images for volumes 2, 37, and 38.
 *
 * For each volume:
 *   - Uploads the cover image (volume-XX.webp) to R2 under volume_image/
 *     and upserts a DB record with usageType='volume_image'
 *   - Uploads the showcase background image to R2 under volume_showcase_background/
 *     and upserts a DB record with usageType='volume_showcase_background'
 *   - Uploads the showcase popout image to R2 under volume_showcase_popout/
 *     and upserts a DB record with usageType='volume_showcase_popout'
 *
 * Reads R2 credentials from server/.env
 * Run with: ts-node -r tsconfig-paths/register scripts/seed-volumes-2-37-38.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AppDataSource } from '../src/data-source';

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const COVERS_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'volume-covers');
const SHOWCASE_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'showcase');

interface ImageTask {
  volumeNumber: number;
  usageType: string;
  localFile: string;
  r2Key: string;
  fileName: string;
}

const TASKS: ImageTask[] = [
  // Volume 2
  {
    volumeNumber: 2,
    usageType: 'volume_image',
    localFile: path.join(COVERS_DIR, 'volume-02.webp'),
    r2Key: 'volume_image/volume-02.webp',
    fileName: 'volume-02.webp',
  },
  {
    volumeNumber: 2,
    usageType: 'volume_showcase_background',
    localFile: path.join(SHOWCASE_DIR, 'Usogui_Volume_2_background.webp'),
    r2Key: 'volume_showcase_background/Usogui_Volume_2_background.webp',
    fileName: 'Usogui_Volume_2_background.webp',
  },
  {
    volumeNumber: 2,
    usageType: 'volume_showcase_popout',
    localFile: path.join(SHOWCASE_DIR, 'Usogui_Volume_2_popout.webp'),
    r2Key: 'volume_showcase_popout/Usogui_Volume_2_popout.webp',
    fileName: 'Usogui_Volume_2_popout.webp',
  },
  // Volume 37
  {
    volumeNumber: 37,
    usageType: 'volume_image',
    localFile: path.join(COVERS_DIR, 'volume-37.webp'),
    r2Key: 'volume_image/volume-37.webp',
    fileName: 'volume-37.webp',
  },
  {
    volumeNumber: 37,
    usageType: 'volume_showcase_background',
    localFile: path.join(SHOWCASE_DIR, 'Usogui_Volume_37_background.webp'),
    r2Key: 'volume_showcase_background/Usogui_Volume_37_background.webp',
    fileName: 'Usogui_Volume_37_background.webp',
  },
  {
    volumeNumber: 37,
    usageType: 'volume_showcase_popout',
    localFile: path.join(SHOWCASE_DIR, 'Usogui_Volume_37_popout.webp'),
    r2Key: 'volume_showcase_popout/Usogui_Volume_37_popout.webp',
    fileName: 'Usogui_Volume_37_popout.webp',
  },
  // Volume 38
  {
    volumeNumber: 38,
    usageType: 'volume_image',
    localFile: path.join(COVERS_DIR, 'volume-38.webp'),
    r2Key: 'volume_image/volume-38.webp',
    fileName: 'volume-38.webp',
  },
  {
    volumeNumber: 38,
    usageType: 'volume_showcase_background',
    localFile: path.join(SHOWCASE_DIR, 'Usogui_Volume_38_background.webp'),
    r2Key: 'volume_showcase_background/Usogui_Volume_38_background.webp',
    fileName: 'Usogui_Volume_38_background.webp',
  },
  {
    volumeNumber: 38,
    usageType: 'volume_showcase_popout',
    localFile: path.join(SHOWCASE_DIR, 'Usogui_Volume_38_popout.webp'),
    r2Key: 'volume_showcase_popout/Usogui_Volume_38_popout.webp',
    fileName: 'Usogui_Volume_38_popout.webp',
  },
];

async function main() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('Missing R2 environment variables. Check server/.env');
    process.exit(1);
  }

  // Verify all local files exist before uploading anything
  for (const task of TASKS) {
    if (!fs.existsSync(task.localFile)) {
      console.error(`Missing local file: ${task.localFile}`);
      process.exit(1);
    }
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  // Upload all files to R2
  const uploads: (ImageTask & { url: string })[] = [];

  console.log(`Uploading ${TASKS.length} images to R2...`);
  for (const task of TASKS) {
    const buffer = fs.readFileSync(task.localFile);
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: task.r2Key,
          Body: buffer,
          ContentType: 'image/webp',
          ContentLength: buffer.length,
        }),
      );
      const url = `${R2_PUBLIC_URL}/${task.r2Key}`;
      uploads.push({ ...task, url });
      console.log(`  ✓ vol ${task.volumeNumber} ${task.usageType}: ${url}`);
    } catch (err) {
      console.error(`  ✗ Failed to upload ${task.fileName}:`, err);
      process.exit(1);
    }
  }

  console.log(`\nAll uploads complete. Upserting DB records...`);

  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    let upserted = 0;

    for (const { volumeNumber, usageType, fileName, r2Key, url } of uploads) {
      // Look up volume id by number
      const volumeRows = await queryRunner.manager.query(
        `SELECT id FROM volume WHERE number = $1 LIMIT 1`,
        [volumeNumber],
      );

      if (volumeRows.length === 0) {
        console.warn(`  ! No volume found with number ${volumeNumber}, skipping`);
        continue;
      }

      const volumeId = volumeRows[0].id;

      // Look for existing record matching this exact usageType
      const existing = await queryRunner.manager.query(
        `SELECT id FROM media
         WHERE "ownerType" = 'volume'
           AND "ownerId" = $1
           AND "usageType" = $2
         LIMIT 1`,
        [volumeId, usageType],
      );

      if (existing.length > 0) {
        await queryRunner.manager.query(
          `UPDATE media
           SET url = $1,
               "fileName" = $2,
               key = $3,
               "isUploaded" = true,
               "mimeType" = 'image/webp',
               status = 'approved',
               purpose = 'entity_display'
           WHERE id = $4`,
          [url, fileName, r2Key, existing[0].id],
        );
        console.log(`  ✓ Updated media ${existing[0].id} (vol ${volumeNumber} ${usageType})`);
      } else {
        await queryRunner.manager.query(
          `INSERT INTO media
             ("ownerType", "ownerId", "usageType", purpose, url, "fileName", key,
              "isUploaded", "mimeType", status, type, "createdAt")
           VALUES
             ('volume', $1, $2, 'entity_display', $3, $4, $5,
              true, 'image/webp', 'approved', 'image', NOW())`,
          [volumeId, usageType, url, fileName, r2Key],
        );
        console.log(`  ✓ Inserted new media (vol ${volumeNumber} ${usageType})`);
      }

      upserted++;
    }

    await queryRunner.commitTransaction();
    console.log(`\nDone. Upserted ${upserted} media records.`);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Transaction failed, rolled back:', err);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
