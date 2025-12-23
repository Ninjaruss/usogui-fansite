import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerTypeToMedia1734040000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the media owner type enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE media_ownertype_enum AS ENUM (
          'character',
          'arc',
          'event',
          'gamble',
          'guide',
          'organization',
          'user',
          'volume'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add ownerType column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS "ownerType" media_ownertype_enum;
    `);

    // Add ownerId column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS "ownerId" integer;
    `);

    // Migrate existing characterId data to ownerType/ownerId
    await queryRunner.query(`
      UPDATE media
      SET "ownerType" = 'character', "ownerId" = "characterId"
      WHERE "characterId" IS NOT NULL AND "ownerType" IS NULL;
    `);

    // Add indexes for the new columns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_media_ownerType_ownerId"
      ON media ("ownerType", "ownerId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_media_ownerType_ownerId_chapterNumber"
      ON media ("ownerType", "ownerId", "chapterNumber");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_media_purpose"
      ON media ("purpose");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_purpose"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_media_ownerType_ownerId_chapterNumber"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_media_ownerType_ownerId"`,
    );

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE media DROP COLUMN IF EXISTS "ownerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE media DROP COLUMN IF EXISTS "ownerType"`,
    );

    // Note: We don't drop the enum type as it may be in use
  }
}
