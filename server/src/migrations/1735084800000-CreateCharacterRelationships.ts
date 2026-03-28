import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharacterRelationships1735084800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE character_relationship_type_enum AS ENUM (
          'ally', 'rival', 'mentor', 'subordinate', 'family', 'partner', 'enemy', 'acquaintance'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS character_relationship (
        id SERIAL PRIMARY KEY,
        "sourceCharacterId" INTEGER NOT NULL,
        "targetCharacterId" INTEGER NOT NULL,
        "relationshipType" character_relationship_type_enum NOT NULL,
        description TEXT,
        "startChapter" INTEGER NOT NULL,
        "endChapter" INTEGER,
        "spoilerChapter" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT fk_source_character
          FOREIGN KEY ("sourceCharacterId")
          REFERENCES character(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_target_character
          FOREIGN KEY ("targetCharacterId")
          REFERENCES character(id)
          ON DELETE CASCADE,

        CONSTRAINT chk_no_self_relationship
          CHECK ("sourceCharacterId" != "targetCharacterId"),

        CONSTRAINT chk_valid_chapter_range
          CHECK ("endChapter" IS NULL OR "endChapter" >= "startChapter")
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_character_relationship_source" ON character_relationship ("sourceCharacterId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_character_relationship_target" ON character_relationship ("targetCharacterId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_character_relationship_type" ON character_relationship ("relationshipType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_character_relationship_spoiler" ON character_relationship ("spoilerChapter")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_character_relationship_unique" ON character_relationship ("sourceCharacterId", "targetCharacterId", "startChapter")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_relationship_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_relationship_spoiler"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_relationship_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_relationship_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_character_relationship_source"`);
    await queryRunner.query(`DROP TABLE IF EXISTS character_relationship`);
    await queryRunner.query(`DROP TYPE IF EXISTS character_relationship_type_enum`);
  }
}
