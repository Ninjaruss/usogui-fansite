import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGambleExplanation1738540000001 implements MigrationInterface {
  name = 'AddGambleExplanation1738540000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add explanation column to gamble table
    await queryRunner.query(`
      ALTER TABLE "gamble"
      ADD COLUMN "explanation" TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove explanation column
    await queryRunner.query(`
      ALTER TABLE "gamble"
      DROP COLUMN IF EXISTS "explanation";
    `);
  }
}
