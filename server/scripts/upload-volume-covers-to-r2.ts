/**
 * Uploads all local volume cover images to Cloudflare R2 and updates
 * the media DB records to point to the new R2 URLs.
 *
 * Reads R2 credentials from server/.env
 * Reads images from client/public/assets/volume-covers/volume-XX.webp
 * Uploads to R2 key: volume_image/volume-XX.webp
 * Updates media rows where ownerType='volume' and purpose='entity_display'
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

const COVERS_DIR = path.join(
  __dirname,
  '..',
  '..',
  'client',
  'public',
  'assets',
  'volume-covers',
);

async function main() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('Missing R2 environment variables. Check server/.env');
    process.exit(1);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  // Collect webp cover files
  const files = fs
    .readdirSync(COVERS_DIR)
    .filter((f) => f.endsWith('.webp') && /^volume-\d{2}\.webp$/.test(f))
    .sort();

  if (files.length === 0) {
    console.error('No volume-XX.webp files found in', COVERS_DIR);
    process.exit(1);
  }

  console.log(`Found ${files.length} volume cover files to upload`);

  // Upload each file and collect results
  const uploads: { volumeNumber: number; key: string; url: string }[] = [];

  for (const file of files) {
    const match = file.match(/^volume-(\d{2})\.webp$/);
    if (!match) continue;
    const volumeNumber = parseInt(match[1], 10);
    const key = `volume_image/${file}`;
    const filePath = path.join(COVERS_DIR, file);
    const buffer = fs.readFileSync(filePath);

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: 'image/webp',
          ContentLength: buffer.length,
        }),
      );
      const url = `${R2_PUBLIC_URL}/${key}`;
      uploads.push({ volumeNumber, key, url });
      console.log(`  ✓ Uploaded volume ${volumeNumber}: ${url}`);
    } catch (err) {
      console.error(`  ✗ Failed to upload ${file}:`, err);
      process.exit(1);
    }
  }

  console.log(`\nAll ${uploads.length} files uploaded. Updating DB...`);

  // Connect to DB and update media rows
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    let updated = 0;

    for (const { volumeNumber, key, url } of uploads) {
      // Find media row for this volume (entity_display purpose)
      const rows = await queryRunner.manager.query(
        `SELECT id FROM media
         WHERE "ownerType" = 'volume'
           AND purpose = 'entity_display'
           AND "ownerId" = (
             SELECT id FROM volume WHERE number = $1 LIMIT 1
           )
         LIMIT 1`,
        [volumeNumber],
      );

      if (rows.length === 0) {
        console.warn(`  ! No media row found for volume ${volumeNumber}, skipping`);
        continue;
      }

      const mediaId = rows[0].id;
      await queryRunner.manager.query(
        `UPDATE media
         SET url = $1,
             "fileName" = $2,
             key = $3,
             "isUploaded" = true,
             "mimeType" = 'image/webp',
             "usageType" = 'volume_image'
         WHERE id = $4`,
        [url, `volume-${String(volumeNumber).padStart(2, '0')}.webp`, key, mediaId],
      );
      updated++;
      console.log(`  ✓ Updated media #${mediaId} for volume ${volumeNumber}`);
    }

    await queryRunner.commitTransaction();
    console.log(`\nDone. Updated ${updated} media rows.`);
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
