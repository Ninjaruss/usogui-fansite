import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCharacterBackstory1738540000000 implements MigrationInterface {
  name = 'AddCharacterBackstory1738540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "character" ADD COLUMN IF NOT EXISTS "backstory" TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "character" DROP COLUMN IF EXISTS "backstory"`);
  }
}
