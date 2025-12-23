import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuideToMediaOwnerType1734040000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'guide' to the media_ownertype_enum type
    await queryRunner.query(`
      ALTER TYPE media_ownertype_enum ADD VALUE IF NOT EXISTS 'guide';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing values from enums directly
    // This would require recreating the enum and updating all references
    // For now, we'll leave this empty as removing enum values is complex
    // and guide media can simply remain in the database
  }
}
