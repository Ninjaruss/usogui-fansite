import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArcParentRelationship1735300000000 implements MigrationInterface {
  name = 'AddArcParentRelationship1735300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "arc" ADD COLUMN IF NOT EXISTS "parentId" INTEGER`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_arc_parent" ON arc ("parentId")`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "arc"
        ADD CONSTRAINT "FK_arc_parent"
        FOREIGN KEY ("parentId") REFERENCES "arc"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "arc" DROP CONSTRAINT IF EXISTS "FK_arc_parent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_arc_parent"`);
    await queryRunner.query(`ALTER TABLE "arc" DROP COLUMN IF EXISTS "parentId"`);
  }
}
