import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1755889985963 implements MigrationInterface {
    name = 'Initial1755889985963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "gamble_team" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "stake" text, "gambleId" integer, CONSTRAINT "PK_f9a23e6eadfbfa38f9ac2ea0d4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "gamble_round" ("id" SERIAL NOT NULL, "roundNumber" integer NOT NULL, "outcome" text NOT NULL, "reward" text, "penalty" text, "gambleId" integer, "winnerId" integer, CONSTRAINT "PK_e8933414eeeebdf5dc164a30cfd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "gamble" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "rules" text NOT NULL, "winCondition" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "chapterId" integer, CONSTRAINT "PK_e20a3e7c86231e62616281b64c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "gamble_team_members" ("gambleTeamId" integer NOT NULL, "characterId" integer NOT NULL, CONSTRAINT "PK_42b2baf6f9b37ea201b3cc155ad" PRIMARY KEY ("gambleTeamId", "characterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2e3869090264e16a9a0b9d0d4f" ON "gamble_team_members" ("gambleTeamId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1e8f2ae55a87d6b225720b9a97" ON "gamble_team_members" ("characterId") `);
        await queryRunner.query(`CREATE TABLE "gamble_observers" ("gambleId" integer NOT NULL, "characterId" integer NOT NULL, CONSTRAINT "PK_ba1999f5a5e9d64f4bf5b606c08" PRIMARY KEY ("gambleId", "characterId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cf52fa3ff9ce0f8b83afe13b75" ON "gamble_observers" ("gambleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_232b38de454865379da4de910c" ON "gamble_observers" ("characterId") `);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gamble_team" ADD CONSTRAINT "FK_9a42fa0a35b01d9f6f868cc0e1f" FOREIGN KEY ("gambleId") REFERENCES "gamble"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gamble_round" ADD CONSTRAINT "FK_4441d160c1d97b0629f1fc07ac1" FOREIGN KEY ("gambleId") REFERENCES "gamble"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gamble_round" ADD CONSTRAINT "FK_bbe0dab0c55113a2d9d04c1614b" FOREIGN KEY ("winnerId") REFERENCES "gamble_team"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gamble" ADD CONSTRAINT "FK_873c55cea2cf5eae8a6dd18a5fb" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gamble_team_members" ADD CONSTRAINT "FK_2e3869090264e16a9a0b9d0d4f1" FOREIGN KEY ("gambleTeamId") REFERENCES "gamble_team"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "gamble_team_members" ADD CONSTRAINT "FK_1e8f2ae55a87d6b225720b9a972" FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "gamble_observers" ADD CONSTRAINT "FK_cf52fa3ff9ce0f8b83afe13b756" FOREIGN KEY ("gambleId") REFERENCES "gamble"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "gamble_observers" ADD CONSTRAINT "FK_232b38de454865379da4de910ca" FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gamble_observers" DROP CONSTRAINT "FK_232b38de454865379da4de910ca"`);
        await queryRunner.query(`ALTER TABLE "gamble_observers" DROP CONSTRAINT "FK_cf52fa3ff9ce0f8b83afe13b756"`);
        await queryRunner.query(`ALTER TABLE "gamble_team_members" DROP CONSTRAINT "FK_1e8f2ae55a87d6b225720b9a972"`);
        await queryRunner.query(`ALTER TABLE "gamble_team_members" DROP CONSTRAINT "FK_2e3869090264e16a9a0b9d0d4f1"`);
        await queryRunner.query(`ALTER TABLE "gamble" DROP CONSTRAINT "FK_873c55cea2cf5eae8a6dd18a5fb"`);
        await queryRunner.query(`ALTER TABLE "gamble_round" DROP CONSTRAINT "FK_bbe0dab0c55113a2d9d04c1614b"`);
        await queryRunner.query(`ALTER TABLE "gamble_round" DROP CONSTRAINT "FK_4441d160c1d97b0629f1fc07ac1"`);
        await queryRunner.query(`ALTER TABLE "gamble_team" DROP CONSTRAINT "FK_9a42fa0a35b01d9f6f868cc0e1f"`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "type" DROP NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_232b38de454865379da4de910c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cf52fa3ff9ce0f8b83afe13b75"`);
        await queryRunner.query(`DROP TABLE "gamble_observers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e8f2ae55a87d6b225720b9a97"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e3869090264e16a9a0b9d0d4f"`);
        await queryRunner.query(`DROP TABLE "gamble_team_members"`);
        await queryRunner.query(`DROP TABLE "gamble"`);
        await queryRunner.query(`DROP TABLE "gamble_round"`);
        await queryRunner.query(`DROP TABLE "gamble_team"`);
    }

}
