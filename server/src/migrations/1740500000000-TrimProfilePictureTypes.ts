import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrimProfilePictureTypes1740500000000 implements MigrationInterface {
  name = 'TrimProfilePictureTypes1740500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the enum already has the target values (i.e. migration already ran via schema sync)
    const result = await queryRunner.query(`
      SELECT array_agg(enumlabel ORDER BY enumsortorder) AS vals
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'user_profilepicturetype_enum'
    `);
    const currentVals: string[] = result[0]?.vals ?? [];
    const targetVals = ['fluxer', 'character_media', 'exclusive_artwork'];
    const alreadyDone =
      currentVals.length === targetVals.length &&
      targetVals.every((v) => currentVals.includes(v));

    if (alreadyDone) return;

    // Reset any users with stale enum values before altering the type.
    // Cast to text so the comparison doesn't fail if those values are already gone from the enum.
    await queryRunner.query(`
      UPDATE "user"
      SET "profilePictureType" = 'fluxer'
      WHERE "profilePictureType"::text IN ('premium_character_media', 'animated_avatar', 'custom_frame')
    `);

    // Drop the _new type if it exists from a partial previous run
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_profilepicturetype_enum_new"`);

    await queryRunner.query(`
      CREATE TYPE "public"."user_profilepicturetype_enum_new"
      AS ENUM ('fluxer', 'character_media', 'exclusive_artwork')
    `);

    // Drop default before type change — Postgres can't auto-cast the default expression
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "profilePictureType" DROP DEFAULT`);

    await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "profilePictureType"
      TYPE "public"."user_profilepicturetype_enum_new"
      USING "profilePictureType"::text::"public"."user_profilepicturetype_enum_new"
    `);

    await queryRunner.query(`DROP TYPE "public"."user_profilepicturetype_enum"`);

    await queryRunner.query(`
      ALTER TYPE "public"."user_profilepicturetype_enum_new"
      RENAME TO "user_profilepicturetype_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_profilepicturetype_enum_old"`);

    await queryRunner.query(`
      CREATE TYPE "public"."user_profilepicturetype_enum_old"
      AS ENUM ('fluxer', 'character_media', 'premium_character_media', 'exclusive_artwork', 'animated_avatar', 'custom_frame')
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "profilePictureType"
      TYPE "public"."user_profilepicturetype_enum_old"
      USING "profilePictureType"::text::"public"."user_profilepicturetype_enum_old"
    `);

    await queryRunner.query(`DROP TYPE "public"."user_profilepicturetype_enum"`);

    await queryRunner.query(`
      ALTER TYPE "public"."user_profilepicturetype_enum_old"
      RENAME TO "user_profilepicturetype_enum"
    `);
  }
}
