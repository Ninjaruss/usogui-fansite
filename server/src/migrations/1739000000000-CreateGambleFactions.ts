import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGambleFactions1739000000000 implements MigrationInterface {
  name = 'CreateGambleFactions1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the faction_member_role enum type
    await queryRunner.query(`
      CREATE TYPE "faction_member_role_enum" AS ENUM ('leader', 'member', 'supporter', 'observer')
    `);

    // Create the gamble_factions table
    await queryRunner.query(`
      CREATE TABLE "gamble_factions" (
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

    // Create index on gambleId for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_gamble_factions_gambleId" ON "gamble_factions" ("gambleId")
    `);

    // Create the gamble_faction_members table
    await queryRunner.query(`
      CREATE TABLE "gamble_faction_members" (
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

    // Create indexes on factionId and characterId
    await queryRunner.query(`
      CREATE INDEX "IDX_gamble_faction_members_factionId" ON "gamble_faction_members" ("factionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_gamble_faction_members_characterId" ON "gamble_faction_members" ("characterId")
    `);

    // Note: Existing gamble_participants data is preserved for backward compatibility.
    // The new factions structure can be used alongside the existing participants relationship.
    // To migrate existing participants to factions, use the admin UI or a separate migration script.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the gamble_faction_members table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gamble_faction_members_characterId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gamble_faction_members_factionId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gamble_faction_members"`);

    // Drop the gamble_factions table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gamble_factions_gambleId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gamble_factions"`);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "faction_member_role_enum"`);
  }
}
