import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFluxerFields1740000000000 implements MigrationInterface {
  name = 'AddFluxerFields1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "fluxerId" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "fluxerUsername" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "fluxerAvatar" VARCHAR`);

    // Add UNIQUE constraint on fluxerId if not already present
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "user" ADD CONSTRAINT "UQ_user_fluxerId" UNIQUE ("fluxerId");
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_fluxerId" ON "user" ("fluxerId")`);

    await queryRunner.query(`ALTER TYPE "public"."user_profilepicturetype_enum" ADD VALUE IF NOT EXISTS 'fluxer'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_fluxerId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "UQ_user_fluxerId"`);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "fluxerAvatar",
      DROP COLUMN IF EXISTS "fluxerUsername",
      DROP COLUMN IF EXISTS "fluxerId"
    `);
  }
}
