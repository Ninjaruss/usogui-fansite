import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharacterOrganizations1735200000000
  implements MigrationInterface
{
  name = 'CreateCharacterOrganizations1735200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the new character_organization table
    await queryRunner.query(`
      CREATE TABLE "character_organization" (
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

    // Create indexes for efficient queries
    await queryRunner.query(`
      CREATE INDEX "IDX_character_organization_character"
      ON character_organization ("characterId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_character_organization_organization"
      ON character_organization ("organizationId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_character_organization_spoiler"
      ON character_organization ("spoilerChapter");
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "character_organization"
      ADD CONSTRAINT "FK_character_organization_character"
      FOREIGN KEY ("characterId") REFERENCES "character"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "character_organization"
      ADD CONSTRAINT "FK_character_organization_organization"
      FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    // Migrate existing data from the old many-to-many join table
    // We'll set default values for the new fields
    await queryRunner.query(`
      INSERT INTO "character_organization" ("characterId", "organizationId", "role", "startChapter", "spoilerChapter")
      SELECT
        "characterId",
        "organizationId",
        'Member' as "role",
        1 as "startChapter",
        1 as "spoilerChapter"
      FROM "organization_characters_character"
      ON CONFLICT DO NOTHING;
    `);

    // Drop the old many-to-many join table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "organization_characters_character";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the old many-to-many join table
    await queryRunner.query(`
      CREATE TABLE "organization_characters_character" (
        "organizationId" INTEGER NOT NULL,
        "characterId" INTEGER NOT NULL,
        CONSTRAINT "PK_organization_characters_character" PRIMARY KEY ("organizationId", "characterId")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organization_characters_character_org"
      ON "organization_characters_character" ("organizationId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organization_characters_character_char"
      ON "organization_characters_character" ("characterId");
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_characters_character"
      ADD CONSTRAINT "FK_organization_characters_organization"
      FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_characters_character"
      ADD CONSTRAINT "FK_organization_characters_character"
      FOREIGN KEY ("characterId") REFERENCES "character"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    // Migrate data back (note: we lose the role/chapter info)
    await queryRunner.query(`
      INSERT INTO "organization_characters_character" ("organizationId", "characterId")
      SELECT DISTINCT "organizationId", "characterId"
      FROM "character_organization"
      ON CONFLICT DO NOTHING;
    `);

    // Drop the character_organization table
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_organization_spoiler"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_organization_organization"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_organization_character"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "character_organization"`);
  }
}
