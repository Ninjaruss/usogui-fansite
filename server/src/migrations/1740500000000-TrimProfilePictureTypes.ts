import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrimProfilePictureTypes1740500000000 implements MigrationInterface {
  name = 'TrimProfilePictureTypes1740500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Reset any users with stale enum values to 'fluxer' before altering the type
    await queryRunner.query(`
      UPDATE "user"
      SET "profilePictureType" = 'fluxer'
      WHERE "profilePictureType" IN ('premium_character_media', 'animated_avatar', 'custom_frame');
    `);

    // PostgreSQL requires recreating the enum to remove values
    await queryRunner.query(`
      CREATE TYPE "public"."user_profilepicturetype_enum_new"
      AS ENUM ('fluxer', 'character_media', 'exclusive_artwork');
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "profilePictureType"
      TYPE "public"."user_profilepicturetype_enum_new"
      USING "profilePictureType"::text::"public"."user_profilepicturetype_enum_new";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."user_profilepicturetype_enum";
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."user_profilepicturetype_enum_new"
      RENAME TO "user_profilepicturetype_enum";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the full enum with all 6 original values
    await queryRunner.query(`
      CREATE TYPE "public"."user_profilepicturetype_enum_old"
      AS ENUM ('fluxer', 'character_media', 'premium_character_media', 'exclusive_artwork', 'animated_avatar', 'custom_frame');
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "profilePictureType"
      TYPE "public"."user_profilepicturetype_enum_old"
      USING "profilePictureType"::text::"public"."user_profilepicturetype_enum_old";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."user_profilepicturetype_enum";
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."user_profilepicturetype_enum_old"
      RENAME TO "user_profilepicturetype_enum";
    `);
  }
}
