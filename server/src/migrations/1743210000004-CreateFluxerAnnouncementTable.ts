import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFluxerAnnouncementTable1743210000004
  implements MigrationInterface
{
  name = 'CreateFluxerAnnouncementTable1743210000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fluxer_announcement" (
        "id" integer PRIMARY KEY,
        "messageId" varchar NOT NULL,
        "content" text NOT NULL,
        "authorUsername" varchar NOT NULL,
        "authorId" varchar NOT NULL,
        "timestamp" timestamptz NOT NULL,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`ALTER TABLE "fluxer_announcement" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fluxer_announcement"`);
  }
}
