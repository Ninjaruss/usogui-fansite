import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1755850100328 implements MigrationInterface {
    name = 'Initial1755850100328'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "series" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "order" integer NOT NULL DEFAULT '0', "description" text, CONSTRAINT "PK_e725676647382eb54540d7128ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin', 'moderator')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "isEmailVerified" boolean NOT NULL DEFAULT false, "emailVerificationToken" character varying, "password" character varying NOT NULL, "passwordResetToken" character varying, "passwordResetExpires" TIMESTAMP, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bfb14a1cc741c1fb77d99e7110" ON "user" ("passwordResetToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_0e5c4e20d6347103f882d8312a" ON "user" ("emailVerificationToken") `);
        await queryRunner.query(`CREATE TYPE "public"."media_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "media" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "type" character varying, "description" character varying, "status" "public"."media_status_enum" NOT NULL DEFAULT 'pending', "rejectionReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "arcId" integer, "characterId" integer, "eventId" integer, "submittedById" integer NOT NULL, CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "faction" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_5935637aa4ecd999ac0555ae5a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "character" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "arcId" integer, "seriesId" integer, CONSTRAINT "PK_6c4aec48c564968be15078b8ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "arc" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "order" integer NOT NULL DEFAULT '0', "description" text, "seriesId" integer, CONSTRAINT "PK_535dfa53a973685be1a3b5c135a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "startChapter" integer NOT NULL, "endChapter" integer, "arcId" integer, "seriesId" integer, "createdById" integer, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tag" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chapter" ("id" SERIAL NOT NULL, "number" integer NOT NULL, "title" character varying, "summary" text, "arcId" integer, "seriesId" integer, CONSTRAINT "PK_275bd1c62bed7dff839680614ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."chapter_spoiler_level_enum" AS ENUM('reveal', 'outcome', 'twist', 'fate')`);
        await queryRunner.query(`CREATE TYPE "public"."chapter_spoiler_category_enum" AS ENUM('plot', 'character', 'plot_twist')`);
        await queryRunner.query(`CREATE TABLE "chapter_spoiler" ("id" SERIAL NOT NULL, "level" "public"."chapter_spoiler_level_enum" NOT NULL DEFAULT 'reveal', "category" "public"."chapter_spoiler_category_enum" NOT NULL DEFAULT 'plot', "description" text NOT NULL, "isVerified" boolean NOT NULL DEFAULT false, "minimumChapter" integer NOT NULL, "requirementExplanation" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "eventId" integer, "chapterId" integer, CONSTRAINT "PK_965993b971e37ffcc9722c35aa4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "faction_characters_character" ("factionId" integer NOT NULL, "characterId" integer NOT NULL, CONSTRAINT "PK_4129946dd28d5412a3ffee0a35f" PRIMARY KEY ("factionId", "characterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9ce7587daf696e4a5bcea30270" ON "faction_characters_character" ("factionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f10c1e1dce80efd38b959931fb" ON "faction_characters_character" ("characterId") `);
        await queryRunner.query(`CREATE TABLE "event_characters_character" ("eventId" integer NOT NULL, "characterId" integer NOT NULL, CONSTRAINT "PK_f5817021e0b43101db0ae310fb8" PRIMARY KEY ("eventId", "characterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_599be49b119364742a8c959249" ON "event_characters_character" ("eventId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b13bbf52535c5e92b0c76c4a9a" ON "event_characters_character" ("characterId") `);
        await queryRunner.query(`CREATE TABLE "tag_events_event" ("tagId" integer NOT NULL, "eventId" integer NOT NULL, CONSTRAINT "PK_d9690e3673e9b67dd839839fccd" PRIMARY KEY ("tagId", "eventId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bf38287323e91e9dfc2a492ffe" ON "tag_events_event" ("tagId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dd502c817c477cc2b229af6a83" ON "tag_events_event" ("eventId") `);
        await queryRunner.query(`CREATE TABLE "chapter_spoiler_additional_requirements" ("chapterSpoilerId" integer NOT NULL, "chapterId" integer NOT NULL, CONSTRAINT "PK_4da725ee9cad923c41a37e41a6e" PRIMARY KEY ("chapterSpoilerId", "chapterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_52e4cb038016d4c6a4bfd52b6a" ON "chapter_spoiler_additional_requirements" ("chapterSpoilerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_89383de1ca0f08ad3191782706" ON "chapter_spoiler_additional_requirements" ("chapterId") `);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_acbd3d2de4357d42cfa20c2e278" FOREIGN KEY ("arcId") REFERENCES "arc"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_fc91eaabffff0ec9ed36988c95e" FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_4f40a4a46ca65138c9462d912fe" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_65c1bda8beb2257cc72c8581f6f" FOREIGN KEY ("submittedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "character" ADD CONSTRAINT "FK_c5960bf7415d1b1de732c8dc220" FOREIGN KEY ("arcId") REFERENCES "arc"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "character" ADD CONSTRAINT "FK_b65a19a3bb86b5733ce94e2ba50" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "arc" ADD CONSTRAINT "FK_7bf23f167be74fc2c1a8e295685" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_97c4f69b950df60f24b40906d1e" FOREIGN KEY ("arcId") REFERENCES "arc"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_93cf0c5eddabbb913424a587722" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter" ADD CONSTRAINT "FK_1893c22cde9febd7681c348843d" FOREIGN KEY ("arcId") REFERENCES "arc"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter" ADD CONSTRAINT "FK_a8d3469a8cd632fa9a2b9c5d0b9" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD CONSTRAINT "FK_f593d95db46a576a4832616d5c9" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD CONSTRAINT "FK_5f4fd9c3ac05d3885d858f6389f" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "faction_characters_character" ADD CONSTRAINT "FK_9ce7587daf696e4a5bcea30270f" FOREIGN KEY ("factionId") REFERENCES "faction"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "faction_characters_character" ADD CONSTRAINT "FK_f10c1e1dce80efd38b959931fbd" FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_characters_character" ADD CONSTRAINT "FK_599be49b119364742a8c9592492" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "event_characters_character" ADD CONSTRAINT "FK_b13bbf52535c5e92b0c76c4a9a7" FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_events_event" ADD CONSTRAINT "FK_bf38287323e91e9dfc2a492ffe3" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_events_event" ADD CONSTRAINT "FK_dd502c817c477cc2b229af6a839" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" ADD CONSTRAINT "FK_52e4cb038016d4c6a4bfd52b6ab" FOREIGN KEY ("chapterSpoilerId") REFERENCES "chapter_spoiler"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" ADD CONSTRAINT "FK_89383de1ca0f08ad31917827068" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" DROP CONSTRAINT "FK_89383de1ca0f08ad31917827068"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" DROP CONSTRAINT "FK_52e4cb038016d4c6a4bfd52b6ab"`);
        await queryRunner.query(`ALTER TABLE "tag_events_event" DROP CONSTRAINT "FK_dd502c817c477cc2b229af6a839"`);
        await queryRunner.query(`ALTER TABLE "tag_events_event" DROP CONSTRAINT "FK_bf38287323e91e9dfc2a492ffe3"`);
        await queryRunner.query(`ALTER TABLE "event_characters_character" DROP CONSTRAINT "FK_b13bbf52535c5e92b0c76c4a9a7"`);
        await queryRunner.query(`ALTER TABLE "event_characters_character" DROP CONSTRAINT "FK_599be49b119364742a8c9592492"`);
        await queryRunner.query(`ALTER TABLE "faction_characters_character" DROP CONSTRAINT "FK_f10c1e1dce80efd38b959931fbd"`);
        await queryRunner.query(`ALTER TABLE "faction_characters_character" DROP CONSTRAINT "FK_9ce7587daf696e4a5bcea30270f"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP CONSTRAINT "FK_5f4fd9c3ac05d3885d858f6389f"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP CONSTRAINT "FK_f593d95db46a576a4832616d5c9"`);
        await queryRunner.query(`ALTER TABLE "chapter" DROP CONSTRAINT "FK_a8d3469a8cd632fa9a2b9c5d0b9"`);
        await queryRunner.query(`ALTER TABLE "chapter" DROP CONSTRAINT "FK_1893c22cde9febd7681c348843d"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_93cf0c5eddabbb913424a587722"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_97c4f69b950df60f24b40906d1e"`);
        await queryRunner.query(`ALTER TABLE "arc" DROP CONSTRAINT "FK_7bf23f167be74fc2c1a8e295685"`);
        await queryRunner.query(`ALTER TABLE "character" DROP CONSTRAINT "FK_b65a19a3bb86b5733ce94e2ba50"`);
        await queryRunner.query(`ALTER TABLE "character" DROP CONSTRAINT "FK_c5960bf7415d1b1de732c8dc220"`);
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_65c1bda8beb2257cc72c8581f6f"`);
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_4f40a4a46ca65138c9462d912fe"`);
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_fc91eaabffff0ec9ed36988c95e"`);
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_acbd3d2de4357d42cfa20c2e278"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89383de1ca0f08ad3191782706"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52e4cb038016d4c6a4bfd52b6a"`);
        await queryRunner.query(`DROP TABLE "chapter_spoiler_additional_requirements"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd502c817c477cc2b229af6a83"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf38287323e91e9dfc2a492ffe"`);
        await queryRunner.query(`DROP TABLE "tag_events_event"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b13bbf52535c5e92b0c76c4a9a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_599be49b119364742a8c959249"`);
        await queryRunner.query(`DROP TABLE "event_characters_character"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f10c1e1dce80efd38b959931fb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ce7587daf696e4a5bcea30270"`);
        await queryRunner.query(`DROP TABLE "faction_characters_character"`);
        await queryRunner.query(`DROP TABLE "chapter_spoiler"`);
        await queryRunner.query(`DROP TYPE "public"."chapter_spoiler_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chapter_spoiler_level_enum"`);
        await queryRunner.query(`DROP TABLE "chapter"`);
        await queryRunner.query(`DROP TABLE "tag"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "arc"`);
        await queryRunner.query(`DROP TABLE "character"`);
        await queryRunner.query(`DROP TABLE "faction"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TYPE "public"."media_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0e5c4e20d6347103f882d8312a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bfb14a1cc741c1fb77d99e7110"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "series"`);
    }

}
