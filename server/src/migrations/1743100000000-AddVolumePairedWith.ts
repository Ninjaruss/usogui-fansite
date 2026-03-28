import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVolumePairedWith1743100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "volume"
      ADD COLUMN IF NOT EXISTS "pairedVolumeId" integer NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "volume"
      DROP COLUMN IF EXISTS "pairedVolumeId"
    `);
  }
}
