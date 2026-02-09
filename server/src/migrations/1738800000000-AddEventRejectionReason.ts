import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventRejectionReason1738800000000 implements MigrationInterface {
  name = 'AddEventRejectionReason1738800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add rejectionReason column to event table
    await queryRunner.query(`
      ALTER TABLE "event"
      ADD COLUMN "rejectionReason" VARCHAR(500);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove rejectionReason column
    await queryRunner.query(`
      ALTER TABLE "event"
      DROP COLUMN IF EXISTS "rejectionReason";
    `);
  }
}
