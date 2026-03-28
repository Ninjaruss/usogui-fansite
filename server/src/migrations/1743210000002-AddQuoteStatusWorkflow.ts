import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteStatusWorkflow1743210000002 implements MigrationInterface {
  name = 'AddQuoteStatusWorkflow1743210000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "quote_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      ALTER TABLE "quote"
      ADD COLUMN "status" "quote_status_enum" NOT NULL DEFAULT 'pending',
      ADD COLUMN "rejectionReason" VARCHAR(500)
    `);
    // Approve all existing quotes so they stay visible
    await queryRunner.query(`UPDATE "quote" SET "status" = 'approved'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quote" DROP COLUMN "rejectionReason"`);
    await queryRunner.query(`ALTER TABLE "quote" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "quote_status_enum"`);
  }
}
