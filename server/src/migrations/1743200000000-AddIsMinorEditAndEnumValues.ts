import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsMinorEditAndEnumValues1743200000000 implements MigrationInterface {
  name = 'AddIsMinorEditAndEnumValues1743200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum values to edit_log_entitytype_enum
    await queryRunner.query(`ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'tag'`);
    await queryRunner.query(`ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'character_relationship'`);
    await queryRunner.query(`ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'character_organization'`);

    // Add isMinorEdit column to edit_log table
    await queryRunner.query(`
      ALTER TABLE "edit_log"
      ADD COLUMN IF NOT EXISTS "isMinorEdit" BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "edit_log" DROP COLUMN IF EXISTS "isMinorEdit"`);
    // Note: PostgreSQL does not support removing enum values directly.
    // To remove TAG, CHARACTER_RELATIONSHIP, CHARACTER_ORGANIZATION values,
    // a full enum recreation would be required. Omitted for safety.
  }
}
