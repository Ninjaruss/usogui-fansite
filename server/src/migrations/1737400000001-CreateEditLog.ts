import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEditLog1737400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE edit_log_entity_type_enum AS ENUM ('character', 'gamble', 'arc', 'organization', 'event');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE edit_log_action_enum AS ENUM ('create', 'update', 'delete');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS edit_log (
        id SERIAL PRIMARY KEY,
        "entityType" edit_log_entity_type_enum NOT NULL,
        "entityId" INTEGER NOT NULL,
        action edit_log_action_enum NOT NULL,
        "changedFields" JSONB,
        "userId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT fk_edit_log_user
          FOREIGN KEY ("userId")
          REFERENCES "user"(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_edit_log_user" ON edit_log ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_edit_log_entity" ON edit_log ("entityType", "entityId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_edit_log_created" ON edit_log ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_edit_log_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_edit_log_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_edit_log_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS edit_log`);
    await queryRunner.query(`DROP TYPE IF EXISTS edit_log_action_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS edit_log_entity_type_enum`);
  }
}
