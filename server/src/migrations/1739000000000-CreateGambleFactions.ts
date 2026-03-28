import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGambleFactions1739000000000 implements MigrationInterface {
  name = 'CreateGambleFactions1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "faction_member_role_enum" AS ENUM ('leader', 'member', 'supporter', 'observer');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gamble_factions" (
        "id" SERIAL PRIMARY KEY,
        "gambleId" integer NOT NULL,
        "name" varchar(100),
        "supportedGamblerId" integer,
        "displayOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "FK_gamble_factions_gamble" FOREIGN KEY ("gambleId")
          REFERENCES "gamble"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_gamble_factions_supported_gambler" FOREIGN KEY ("supportedGamblerId")
          REFERENCES "character"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_gamble_factions_gambleId" ON "gamble_factions" ("gambleId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gamble_faction_members" (
        "id" SERIAL PRIMARY KEY,
        "factionId" integer NOT NULL,
        "characterId" integer NOT NULL,
        "role" "faction_member_role_enum",
        "displayOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "FK_gamble_faction_members_faction" FOREIGN KEY ("factionId")
          REFERENCES "gamble_factions"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_gamble_faction_members_character" FOREIGN KEY ("characterId")
          REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_gamble_faction_members_factionId" ON "gamble_faction_members" ("factionId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_gamble_faction_members_characterId" ON "gamble_faction_members" ("characterId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gamble_faction_members_characterId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gamble_faction_members_factionId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gamble_faction_members"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gamble_factions_gambleId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gamble_factions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "faction_member_role_enum"`);
  }
}
