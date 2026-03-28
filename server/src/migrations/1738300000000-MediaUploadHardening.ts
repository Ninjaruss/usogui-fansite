import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaUploadHardening1738300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create MediaUsageType enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE media_usagetype_enum AS ENUM ('character_image', 'guide_image', 'gallery_upload');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Add new columns to media table (all nullable for backward compatibility)
    await queryRunner.query(`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS "key" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "mimeType" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
      ADD COLUMN IF NOT EXISTS "width" INTEGER,
      ADD COLUMN IF NOT EXISTS "height" INTEGER,
      ADD COLUMN IF NOT EXISTS "usageType" media_usagetype_enum
    `);

    // 3. Migrate media.id from integer to UUID (only if id is still an integer type)
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'media' AND column_name = 'id'
            AND data_type IN ('integer', 'bigint', 'smallint')
        ) THEN
          -- Add new UUID column
          ALTER TABLE media ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid();
          UPDATE media SET id_new = gen_random_uuid() WHERE id_new IS NULL;
          ALTER TABLE media ALTER COLUMN id_new SET NOT NULL;

          -- Update foreign key in user table (if selectedCharacterMediaId is still integer)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'selectedCharacterMediaId'
              AND data_type IN ('integer', 'bigint', 'smallint')
          ) THEN
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "selectedCharacterMediaId_new" UUID;
            UPDATE "user" u SET "selectedCharacterMediaId_new" = m.id_new
            FROM media m WHERE u."selectedCharacterMediaId" = m.id;
          END IF;

          -- Update foreign key in character_media_popularity table (if mediaId is still integer)
          IF EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'character_media_popularity'
          ) THEN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'character_media_popularity' AND column_name = 'mediaId'
                AND data_type IN ('integer', 'bigint', 'smallint')
            ) THEN
              ALTER TABLE character_media_popularity ADD COLUMN IF NOT EXISTS "mediaId_new" UUID;
              UPDATE character_media_popularity cmp SET "mediaId_new" = m.id_new
              FROM media m WHERE cmp."mediaId" = m.id;
            END IF;
          END IF;

          -- Drop old FK constraints
          ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "FK_user_selectedCharacterMediaId";
          ALTER TABLE character_media_popularity DROP CONSTRAINT IF EXISTS "FK_character_media_popularity_mediaId";
          ALTER TABLE character_media_popularity DROP CONSTRAINT IF EXISTS "UQ_character_media_popularity_mediaId";

          -- Swap user column
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'selectedCharacterMediaId_new'
          ) THEN
            ALTER TABLE "user" DROP COLUMN "selectedCharacterMediaId";
            ALTER TABLE "user" RENAME COLUMN "selectedCharacterMediaId_new" TO "selectedCharacterMediaId";
          END IF;

          -- Swap character_media_popularity column
          IF EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'character_media_popularity'
          ) THEN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'character_media_popularity' AND column_name = 'mediaId_new'
            ) THEN
              ALTER TABLE character_media_popularity DROP COLUMN "mediaId";
              ALTER TABLE character_media_popularity RENAME COLUMN "mediaId_new" TO "mediaId";
            END IF;
          END IF;

          -- Swap media id
          ALTER TABLE media DROP CONSTRAINT IF EXISTS "PK_media";
          ALTER TABLE media DROP COLUMN id;
          ALTER TABLE media RENAME COLUMN id_new TO id;
          ALTER TABLE media ADD CONSTRAINT "PK_media" PRIMARY KEY (id);

          -- Re-add FK constraints
          ALTER TABLE "user"
          ADD CONSTRAINT "FK_user_selectedCharacterMediaId"
          FOREIGN KEY ("selectedCharacterMediaId") REFERENCES media(id) ON DELETE SET NULL;

          IF EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'character_media_popularity'
          ) THEN
            ALTER TABLE character_media_popularity
            ADD CONSTRAINT "FK_character_media_popularity_mediaId"
            FOREIGN KEY ("mediaId") REFERENCES media(id) ON DELETE CASCADE;

            ALTER TABLE character_media_popularity
            ADD CONSTRAINT "UQ_character_media_popularity_mediaId"
            UNIQUE ("mediaId");

            ALTER TABLE character_media_popularity ALTER COLUMN "mediaId" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE media
      DROP COLUMN IF EXISTS "key",
      DROP COLUMN IF EXISTS "mimeType",
      DROP COLUMN IF EXISTS "fileSize",
      DROP COLUMN IF EXISTS "width",
      DROP COLUMN IF EXISTS "height",
      DROP COLUMN IF EXISTS "usageType"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS media_usagetype_enum`);
    console.log('UUID to integer rollback not implemented - would require complex data migration');
  }
}
