import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationColumnsToEditorialEntities1743210000001 implements MigrationInterface {
  name = 'AddVerificationColumnsToEditorialEntities1743210000001';

  private readonly tables = [
    'character',
    'arc',
    'gamble',
    'chapter',
    'organization',
    'tag',
    'character_relationship',
    'character_organization',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "verifiedById" INTEGER REFERENCES "user"("id") ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        DROP COLUMN IF EXISTS "isVerified",
        DROP COLUMN IF EXISTS "verifiedById",
        DROP COLUMN IF EXISTS "verifiedAt"
      `);
    }
  }
}
