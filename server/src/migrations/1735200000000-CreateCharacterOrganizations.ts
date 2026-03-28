import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharacterOrganizations1735200000000 implements MigrationInterface {
  name = 'CreateCharacterOrganizations1735200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "character_organization" (
        "id" SERIAL NOT NULL,
        "characterId" INTEGER NOT NULL,
        "organizationId" INTEGER NOT NULL,
        "role" VARCHAR(100) NOT NULL,
        "startChapter" INTEGER NOT NULL,
        "endChapter" INTEGER,
        "spoilerChapter" INTEGER NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_character_organization" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_character_organization_end_after_start" CHECK ("endChapter" IS NULL OR "endChapter" >= "startChapter")
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_character_organization_character" ON character_organization ("characterId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_character_organization_organization" ON character_organization ("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_character_organization_spoiler" ON character_organization ("spoilerChapter")`);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "character_organization"
        ADD CONSTRAINT "FK_character_organization_character"
        FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "character_organization"
        ADD CONSTRAINT "FK_character_organization_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // Migrate from old join table if it still exists
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_characters_character') THEN
          INSERT INTO "character_organization" ("characterId", "organizationId", "role", "startChapter", "spoilerChapter")
          SELECT "characterId", "organizationId", 'Member', 1, 1
          FROM "organization_characters_character"
          ON CONFLICT DO NOTHING;
        END IF;
      END $$;
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "organization_characters_character"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_characters_character" (
        "organizationId" INTEGER NOT NULL,
        "characterId" INTEGER NOT NULL,
        CONSTRAINT "PK_organization_characters_character" PRIMARY KEY ("organizationId", "characterId")
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_organization_characters_character_org" ON "organization_characters_character" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_organization_characters_character_char" ON "organization_characters_character" ("characterId")`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "organization_characters_character"
        ADD CONSTRAINT "FK_organization_characters_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "organization_characters_character"
        ADD CONSTRAINT "FK_organization_characters_character"
        FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      INSERT INTO "organization_characters_character" ("organizationId", "characterId")
      SELECT DISTINCT "organizationId", "characterId" FROM "character_organization"
      ON CONFLICT DO NOTHING;
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_organization_spoiler"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_organization_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_organization_character"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "character_organization"`);
  }
}
