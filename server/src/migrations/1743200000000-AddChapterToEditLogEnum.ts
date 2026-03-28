import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChapterToEditLogEnum1743200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'chapter'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // To revert, a full enum re-creation would be needed; omitting for safety.
  }
}
