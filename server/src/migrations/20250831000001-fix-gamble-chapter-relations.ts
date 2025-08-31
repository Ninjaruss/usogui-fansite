import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixGambleChapterRelations20250831000001 implements MigrationInterface {
  name = 'FixGambleChapterRelations20250831000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, ensure we have some basic chapters if they don't exist
    await queryRunner.query(`
      INSERT INTO chapter (number, title, summary) 
      SELECT * FROM (
        VALUES 
          (1, 'Chapter 1: The Beginning', 'The start of the gambling saga'),
          (5, 'Chapter 5: Poker Tournament', 'High stakes poker'),
          (10, 'Chapter 10: Russian Roulette Variant', 'A deadly game'),
          (15, 'Chapter 15: Card Matching', 'Memory and strategy'),
          (20, 'Chapter 20: Advanced Tactics', 'Complex gambling strategies'),
          (25, 'Chapter 25: Team Games', 'Collaborative gambling'),
          (30, 'Chapter 30: Final Showdown', 'The ultimate test')
      ) AS v(number, title, summary)
      WHERE NOT EXISTS (
        SELECT 1 FROM chapter c WHERE c.number = v.number
      )
    `);

    // Update existing gambles to reference proper chapter IDs
    // This maps hardcoded chapterIds to actual chapter.id values
    await queryRunner.query(`
      UPDATE gamble 
      SET "chapterId" = (
        SELECT c.id 
        FROM chapter c 
        WHERE c.number = CASE 
          WHEN gamble."chapterId" = 1 THEN 1
          WHEN gamble."chapterId" = 5 THEN 5  
          WHEN gamble."chapterId" = 10 THEN 10
          WHEN gamble."chapterId" = 15 THEN 15
          ELSE 1  -- Default to chapter 1 for any other values
        END
        LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1 FROM chapter c 
        WHERE c.number IN (1, 5, 10, 15)
      )
    `);

    // Add foreign key constraint if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_gamble_chapter' 
          AND table_name = 'gamble'
        ) THEN
          ALTER TABLE gamble 
          ADD CONSTRAINT "FK_gamble_chapter" 
          FOREIGN KEY ("chapterId") REFERENCES chapter(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // Create index for better performance on chapter lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_gamble_chapterId" ON gamble ("chapterId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE gamble DROP CONSTRAINT IF EXISTS "FK_gamble_chapter"
    `);

    // Remove the index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_gamble_chapterId"
    `);

    // Note: We don't remove the chapters we created as they might be referenced by other data
    // If you need to remove them, do it manually after ensuring no dependencies exist
  }
}