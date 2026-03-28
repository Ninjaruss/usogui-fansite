import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteStatusWorkflow1743210000002 implements MigrationInterface {
  name = 'AddQuoteStatusWorkflow1743210000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "quote_status_enum" AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "quote"
      ADD COLUMN IF NOT EXISTS "status" "quote_status_enum" NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "rejectionReason" VARCHAR(500)
    `);

    // Approve all existing quotes so they stay visible
    await queryRunner.query(`UPDATE "quote" SET "status" = 'approved' WHERE "status" = 'pending'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quote" DROP COLUMN IF EXISTS "rejectionReason"`);
    await queryRunner.query(`ALTER TABLE "quote" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "quote_status_enum"`);
  }
}
