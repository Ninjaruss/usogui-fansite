import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnnotations1737400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE annotation_status_enum AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE annotation_owner_type_enum AS ENUM ('character', 'gamble', 'chapter', 'arc');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS annotation (
        id SERIAL PRIMARY KEY,
        "ownerType" annotation_owner_type_enum NOT NULL,
        "ownerId" INTEGER NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        "sourceUrl" VARCHAR(500),
        "chapterReference" INTEGER,
        "isSpoiler" BOOLEAN NOT NULL DEFAULT false,
        "spoilerChapter" INTEGER,
        status annotation_status_enum NOT NULL DEFAULT 'pending',
        "rejectionReason" VARCHAR(500),
        "authorId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT fk_annotation_author
          FOREIGN KEY ("authorId")
          REFERENCES "user"(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_annotation_status" ON annotation (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_annotation_owner" ON annotation ("ownerType", "ownerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_annotation_author" ON annotation ("authorId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_annotation_created" ON annotation ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_annotation_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_annotation_author"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_annotation_owner"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_annotation_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS annotation`);
    await queryRunner.query(`DROP TYPE IF EXISTS annotation_owner_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS annotation_status_enum`);
  }
}
