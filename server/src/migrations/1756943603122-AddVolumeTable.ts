import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVolumeTable1756943603122 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create volume table
        await queryRunner.query(`
            CREATE TABLE "volume" (
                "id" SERIAL NOT NULL, 
                "number" integer NOT NULL, 
                "title" character varying(200), 
                "coverUrl" character varying(500), 
                "startChapter" integer NOT NULL, 
                "endChapter" integer NOT NULL, 
                "description" text, 
                "seriesId" integer NOT NULL, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_volume_id" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_volume_series" ON "volume" ("seriesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_volume_number" ON "volume" ("number") `);

        // Create foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "volume" 
            ADD CONSTRAINT "FK_volume_series" 
            FOREIGN KEY ("seriesId") 
            REFERENCES "series"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key first
        await queryRunner.query(`ALTER TABLE "volume" DROP CONSTRAINT "FK_volume_series"`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_volume_number"`);
        await queryRunner.query(`DROP INDEX "IDX_volume_series"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "volume"`);
    }
}
