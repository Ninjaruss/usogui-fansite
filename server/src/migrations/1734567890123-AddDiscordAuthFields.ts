import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscordAuthFields1734567890123 implements MigrationInterface {
  name = 'AddDiscordAuthFields1734567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Discord fields to user table
    await queryRunner.query(
      `ALTER TABLE "user" ADD "discordId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "discordUsername" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "discordAvatar" character varying`,
    );

    // Make password nullable for Discord-only users
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`,
    );

    // Make email nullable for Discord-only users
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL`,
    );

    // Remove email unique constraint
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
    );

    // Add unique constraint for discordId
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_discordId" UNIQUE ("discordId")`,
    );

    // Create index for Discord ID for faster lookups
    await queryRunner.query(
      `CREATE INDEX "IDX_user_discordId" ON "user" ("discordId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove Discord-related indexes and constraints
    await queryRunner.query(`DROP INDEX "IDX_user_discordId"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_discordId"`,
    );

    // Restore email unique constraint (this may fail if there are duplicate emails)
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
    );

    // Make email required again (this may fail if there are null emails)
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL`,
    );

    // Make password required again (this may fail if there are null passwords)
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`,
    );

    // Remove Discord fields
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "discordAvatar"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "discordUsername"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "discordId"`);
  }
}