import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCharacterBackstory1738540000000 implements MigrationInterface {
  name = 'AddCharacterBackstory1738540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add backstory column to character table
    await queryRunner.query(`
      ALTER TABLE "character"
      ADD COLUMN "backstory" TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove backstory column
    await queryRunner.query(`
      ALTER TABLE "character"
      DROP COLUMN IF EXISTS "backstory";
    `);
  }
}
