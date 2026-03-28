import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRowLevelSecurity1737500000000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // RLS via Supabase's auth schema requires superuser privileges and PostgREST's
    // JWT claim injection, neither of which apply to this NestJS/TypeORM app.
    // Authorization is enforced at the application layer via NestJS guards.
    // This migration is intentionally a no-op.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
