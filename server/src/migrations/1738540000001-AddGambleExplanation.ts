import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGambleExplanation1738540000001 implements MigrationInterface {
  name = 'AddGambleExplanation1738540000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "gamble" ADD COLUMN IF NOT EXISTS "explanation" TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "gamble" DROP COLUMN IF EXISTS "explanation"`);
  }
}
