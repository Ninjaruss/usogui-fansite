import { MigrationInterface, QueryRunner } from "typeorm";

export class TranslationsRefactor1755874465735 implements MigrationInterface {
    name = 'TranslationsRefactor1755874465735'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tag_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "tag_translations" ("id" SERIAL NOT NULL, "language" "public"."tag_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "tag_id" integer NOT NULL, "name" text NOT NULL, CONSTRAINT "PK_6d541def9a3fbed4abeccd9f343" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."series_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "series_translations" ("id" SERIAL NOT NULL, "language" "public"."series_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "series_id" integer NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_0289af1fd6a739341c659f9d19e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."faction_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "faction_translations" ("id" SERIAL NOT NULL, "language" "public"."faction_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "faction_id" integer NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_1a9038eb16257ade2c54585a51b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."character_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "character_translations" ("id" SERIAL NOT NULL, "language" "public"."character_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "character_id" integer NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_20ee0783c15af06ff3573e6d94c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."chapter_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "chapter_translations" ("id" SERIAL NOT NULL, "language" "public"."chapter_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "chapter_id" integer NOT NULL, "title" text NOT NULL, "summary" text, CONSTRAINT "PK_c662864bbebcb1327f491ad15cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."chapter_spoiler_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "chapter_spoiler_translations" ("id" SERIAL NOT NULL, "language" "public"."chapter_spoiler_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "chapter_spoiler_id" integer NOT NULL, "description" text NOT NULL, "requirementExplanation" text, CONSTRAINT "PK_fceaca6a0746379fb51bbbfdec0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."arc_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "arc_translations" ("id" SERIAL NOT NULL, "language" "public"."arc_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "arc_id" integer NOT NULL, "name" text NOT NULL, "description" text, CONSTRAINT "PK_147cea61df60781c0566e0aa9c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."event_translations_language_enum" AS ENUM('en', 'ja')`);
        await queryRunner.query(`CREATE TABLE "event_translations" ("id" SERIAL NOT NULL, "language" "public"."event_translations_language_enum" NOT NULL DEFAULT 'en', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "event_id" integer NOT NULL, "title" text NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_217547864a3f2e39502be2059cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tag_translations" ADD CONSTRAINT "FK_e656e089d689dbb4306d2cd1b0d" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "series_translations" ADD CONSTRAINT "FK_d91a300a3a4c1803e815de6df1f" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "faction_translations" ADD CONSTRAINT "FK_c7c363047732db699554634d0a6" FOREIGN KEY ("faction_id") REFERENCES "faction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "character_translations" ADD CONSTRAINT "FK_bdb39a702b2ddad049bc43bba43" FOREIGN KEY ("character_id") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter_translations" ADD CONSTRAINT "FK_65f0a50ae9f6130ce0e82e60c6f" FOREIGN KEY ("chapter_id") REFERENCES "chapter"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_translations" ADD CONSTRAINT "FK_12eafa5092e1dca25501d8b622e" FOREIGN KEY ("chapter_spoiler_id") REFERENCES "chapter_spoiler"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "arc_translations" ADD CONSTRAINT "FK_1ac3ee2da3459fbfb132d12246b" FOREIGN KEY ("arc_id") REFERENCES "arc"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_translations" ADD CONSTRAINT "FK_a6c15dd689a8f7a51fca191a207" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_translations" DROP CONSTRAINT "FK_a6c15dd689a8f7a51fca191a207"`);
        await queryRunner.query(`ALTER TABLE "arc_translations" DROP CONSTRAINT "FK_1ac3ee2da3459fbfb132d12246b"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_translations" DROP CONSTRAINT "FK_12eafa5092e1dca25501d8b622e"`);
        await queryRunner.query(`ALTER TABLE "chapter_translations" DROP CONSTRAINT "FK_65f0a50ae9f6130ce0e82e60c6f"`);
        await queryRunner.query(`ALTER TABLE "character_translations" DROP CONSTRAINT "FK_bdb39a702b2ddad049bc43bba43"`);
        await queryRunner.query(`ALTER TABLE "faction_translations" DROP CONSTRAINT "FK_c7c363047732db699554634d0a6"`);
        await queryRunner.query(`ALTER TABLE "series_translations" DROP CONSTRAINT "FK_d91a300a3a4c1803e815de6df1f"`);
        await queryRunner.query(`ALTER TABLE "tag_translations" DROP CONSTRAINT "FK_e656e089d689dbb4306d2cd1b0d"`);
        await queryRunner.query(`DROP TABLE "event_translations"`);
        await queryRunner.query(`DROP TYPE "public"."event_translations_language_enum"`);
        await queryRunner.query(`DROP TABLE "arc_translations"`);
        await queryRunner.query(`DROP TYPE "public"."arc_translations_language_enum"`);
        await queryRunner.query(`DROP TABLE "chapter_spoiler_translations"`);
        await queryRunner.query(`DROP TYPE "public"."chapter_spoiler_translations_language_enum"`);
        await queryRunner.query(`DROP TABLE "chapter_translations"`);
        await queryRunner.query(`DROP TYPE "public"."chapter_translations_language_enum"`);
        await queryRunner.query(`DROP TABLE "character_translations"`);
        await queryRunner.query(`DROP TYPE "public"."character_translations_language_enum"`);
        await queryRunner.query(`DROP TABLE "faction_translations"`);
        await queryRunner.query(`DROP TYPE "public"."faction_translations_language_enum"`);
        await queryRunner.query(`DROP TABLE "series_translations"`);
        await queryRunner.query(`DROP TYPE "public"."series_translations_language_enum"`);
        await queryRunner.query(`DROP TABLE "tag_translations"`);
        await queryRunner.query(`DROP TYPE "public"."tag_translations_language_enum"`);
    }

}
