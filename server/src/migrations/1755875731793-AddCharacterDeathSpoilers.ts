import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCharacterDeathSpoilers1755875731793 implements MigrationInterface {
    name = 'AddCharacterDeathSpoilers1755875731793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chapter_spoiler_characters" ("chapterSpoilerId" integer NOT NULL, "characterId" integer NOT NULL, CONSTRAINT "PK_667e52bedfb1425af83b4027fa5" PRIMARY KEY ("chapterSpoilerId", "characterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1e975633f70b6c18797813acd1" ON "chapter_spoiler_characters" ("chapterSpoilerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_98977aff5d35c9afb422af2bde" ON "chapter_spoiler_characters" ("characterId") `);
        await queryRunner.query(`ALTER TABLE "character" ADD "alternateNames" text`);
        await queryRunner.query(`ALTER TABLE "character" ADD "firstAppearanceChapter" integer`);
        await queryRunner.query(`ALTER TABLE "character" ADD "notableRoles" text`);
        await queryRunner.query(`ALTER TABLE "character" ADD "notableGames" text`);
        await queryRunner.query(`ALTER TABLE "character" ADD "occupation" character varying`);
        await queryRunner.query(`ALTER TABLE "character" ADD "affiliations" text`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "isDeathSpoiler" boolean`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "deathContext" text`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_characters" ADD CONSTRAINT "FK_1e975633f70b6c18797813acd1f" FOREIGN KEY ("chapterSpoilerId") REFERENCES "chapter_spoiler"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_characters" ADD CONSTRAINT "FK_98977aff5d35c9afb422af2bde1" FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_characters" DROP CONSTRAINT "FK_98977aff5d35c9afb422af2bde1"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_characters" DROP CONSTRAINT "FK_1e975633f70b6c18797813acd1f"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "deathContext"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "isDeathSpoiler"`);
        await queryRunner.query(`ALTER TABLE "character" DROP COLUMN "affiliations"`);
        await queryRunner.query(`ALTER TABLE "character" DROP COLUMN "occupation"`);
        await queryRunner.query(`ALTER TABLE "character" DROP COLUMN "notableGames"`);
        await queryRunner.query(`ALTER TABLE "character" DROP COLUMN "notableRoles"`);
        await queryRunner.query(`ALTER TABLE "character" DROP COLUMN "firstAppearanceChapter"`);
        await queryRunner.query(`ALTER TABLE "character" DROP COLUMN "alternateNames"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98977aff5d35c9afb422af2bde"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e975633f70b6c18797813acd1"`);
        await queryRunner.query(`DROP TABLE "chapter_spoiler_characters"`);
    }

}
