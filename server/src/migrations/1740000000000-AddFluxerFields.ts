import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFluxerFields1740000000000 implements MigrationInterface {
  name = 'AddFluxerFields1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Fluxer columns to user table
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "fluxerId" VARCHAR UNIQUE,
      ADD COLUMN "fluxerUsername" VARCHAR,
      ADD COLUMN "fluxerAvatar" VARCHAR;
    `);

    // Add index on fluxerId
    await queryRunner.query(`
      CREATE INDEX "IDX_user_fluxerId" ON "user" ("fluxerId");
    `);

    // Add 'fluxer' to profile_picture_type enum
    await queryRunner.query(`
      ALTER TYPE "public"."user_profilepicturetype_enum"
      ADD VALUE IF NOT EXISTS 'fluxer';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_fluxerId";
    `);

    // Remove Fluxer columns
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "fluxerAvatar",
      DROP COLUMN IF EXISTS "fluxerUsername",
      DROP COLUMN IF EXISTS "fluxerId";
    `);

    // Note: PostgreSQL does not support removing values from enums easily.
    // The 'fluxer' enum value will remain but be unused after rollback.
  }
}
