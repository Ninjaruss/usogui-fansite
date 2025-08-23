import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1755847808032 implements MigrationInterface {
    name = 'Initial1755847808032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chapter_spoiler_additional_requirements" ("chapterSpoilerId" integer NOT NULL, "chapterId" integer NOT NULL, CONSTRAINT "PK_4da725ee9cad923c41a37e41a6e" PRIMARY KEY ("chapterSpoilerId", "chapterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_52e4cb038016d4c6a4bfd52b6a" ON "chapter_spoiler_additional_requirements" ("chapterSpoilerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_89383de1ca0f08ad3191782706" ON "chapter_spoiler_additional_requirements" ("chapterId") `);
        await queryRunner.query(`CREATE TYPE "public"."chapter_spoiler_level_enum" AS ENUM('reveal', 'outcome', 'twist', 'fate')`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "level" "public"."chapter_spoiler_level_enum" NOT NULL DEFAULT 'reveal'`);
        await queryRunner.query(`CREATE TYPE "public"."chapter_spoiler_category_enum" AS ENUM('plot', 'character', 'plot_twist')`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "category" "public"."chapter_spoiler_category_enum" NOT NULL DEFAULT 'plot'`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "description" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "isVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "minimumChapter" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "requirementExplanation" text`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" ADD CONSTRAINT "FK_52e4cb038016d4c6a4bfd52b6ab" FOREIGN KEY ("chapterSpoilerId") REFERENCES "chapter_spoiler"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" ADD CONSTRAINT "FK_89383de1ca0f08ad31917827068" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" DROP CONSTRAINT "FK_89383de1ca0f08ad31917827068"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler_additional_requirements" DROP CONSTRAINT "FK_52e4cb038016d4c6a4bfd52b6ab"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "requirementExplanation"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "minimumChapter"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "isVerified"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."chapter_spoiler_category_enum"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "level"`);
        await queryRunner.query(`DROP TYPE "public"."chapter_spoiler_level_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89383de1ca0f08ad3191782706"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52e4cb038016d4c6a4bfd52b6a"`);
        await queryRunner.query(`DROP TABLE "chapter_spoiler_additional_requirements"`);
    }

}
