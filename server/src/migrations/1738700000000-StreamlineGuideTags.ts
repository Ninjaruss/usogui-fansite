import { MigrationInterface, QueryRunner } from 'typeorm';

export class StreamlineGuideTags1738700000000 implements MigrationInterface {
  name = 'StreamlineGuideTags1738700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Insert the new tags if they don't exist
    await queryRunner.query(`
      INSERT INTO "tag" ("name", "description")
      VALUES
        ('Gamble Breakdown', 'Analysis of gambling mechanics, rules, and strategies'),
        ('Character Study', 'Deep dives into character psychology and motivations'),
        ('Plot Analysis', 'Story structure, arcs, foreshadowing, and twists')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // Step 2: Get the IDs of the new tags
    const gambleBreakdownTag = await queryRunner.query(
      `SELECT id FROM "tag" WHERE name = 'Gamble Breakdown'`,
    );
    const characterStudyTag = await queryRunner.query(
      `SELECT id FROM "tag" WHERE name = 'Character Study'`,
    );
    const plotAnalysisTag = await queryRunner.query(
      `SELECT id FROM "tag" WHERE name = 'Plot Analysis'`,
    );

    const gambleBreakdownId = gambleBreakdownTag[0]?.id;
    const characterStudyId = characterStudyTag[0]?.id;
    const plotAnalysisId = plotAnalysisTag[0]?.id;

    if (!gambleBreakdownId || !characterStudyId || !plotAnalysisId) {
      throw new Error('Failed to get IDs for new tags');
    }

    // Step 3: Map old tags to new categories in guide_tags
    // Gambling-related -> Gamble Breakdown
    await queryRunner.query(
      `
      UPDATE "guide_tags"
      SET "tagId" = $1
      WHERE "tagId" IN (
        SELECT id FROM "tag" WHERE name IN ('Gambling', 'High Stakes', 'Tournament', 'Strategy')
      );
    `,
      [gambleBreakdownId],
    );

    // Character-related -> Character Study
    await queryRunner.query(
      `
      UPDATE "guide_tags"
      SET "tagId" = $1
      WHERE "tagId" IN (
        SELECT id FROM "tag" WHERE name IN ('Character Development', 'Backstory', 'Psychological', 'Lie Detection')
      );
    `,
      [characterStudyId],
    );

    // Plot-related -> Plot Analysis
    await queryRunner.query(
      `
      UPDATE "guide_tags"
      SET "tagId" = $1
      WHERE "tagId" IN (
        SELECT id FROM "tag" WHERE name IN ('Plot Twist', 'Mystery', 'Action', 'Alliance', 'Betrayal', 'Life or Death', 'Kakerou')
      );
    `,
      [plotAnalysisId],
    );

    // Step 4: Remove duplicate associations (same guide can't have same tag twice)
    await queryRunner.query(`
      DELETE FROM "guide_tags" a
      USING "guide_tags" b
      WHERE a.ctid < b.ctid
        AND a."guideId" = b."guideId"
        AND a."tagId" = b."tagId";
    `);

    // Step 5: Update event_tags as well (if applicable)
    await queryRunner.query(
      `
      UPDATE "tag_events_event"
      SET "tagId" = $1
      WHERE "tagId" IN (
        SELECT id FROM "tag" WHERE name IN ('Gambling', 'High Stakes', 'Tournament', 'Strategy')
      );
    `,
      [gambleBreakdownId],
    );

    await queryRunner.query(
      `
      UPDATE "tag_events_event"
      SET "tagId" = $1
      WHERE "tagId" IN (
        SELECT id FROM "tag" WHERE name IN ('Character Development', 'Backstory', 'Psychological', 'Lie Detection')
      );
    `,
      [characterStudyId],
    );

    await queryRunner.query(
      `
      UPDATE "tag_events_event"
      SET "tagId" = $1
      WHERE "tagId" IN (
        SELECT id FROM "tag" WHERE name IN ('Plot Twist', 'Mystery', 'Action', 'Alliance', 'Betrayal', 'Life or Death', 'Kakerou')
      );
    `,
      [plotAnalysisId],
    );

    // Remove duplicate event tag associations
    await queryRunner.query(`
      DELETE FROM "tag_events_event" a
      USING "tag_events_event" b
      WHERE a.ctid < b.ctid
        AND a."eventId" = b."eventId"
        AND a."tagId" = b."tagId";
    `);

    // Step 6: Delete old tags (ones not in our new set)
    await queryRunner.query(`
      DELETE FROM "tag"
      WHERE name NOT IN ('Gamble Breakdown', 'Character Study', 'Plot Analysis');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore original tags
    await queryRunner.query(`
      INSERT INTO "tag" ("name", "description")
      VALUES
        ('High Stakes', 'Content involving high-stakes gambling scenarios with significant consequences'),
        ('Psychological', 'Events that focus on psychological manipulation, mind games, and mental strategy'),
        ('Action', 'Fast-paced scenes with physical confrontations or intense situations'),
        ('Mystery', 'Events involving mysteries, hidden information, or plot reveals'),
        ('Character Development', 'Scenes that significantly develop character backgrounds, motivations, or relationships'),
        ('Plot Twist', 'Unexpected turns in the story that change the direction of the narrative'),
        ('Gambling', 'Scenes focused on various forms of gambling and gaming'),
        ('Kakerou', 'Content related to the Kakerou organization and its activities'),
        ('Lie Detection', 'Scenes showcasing Baku''s ability to detect lies and deception'),
        ('Alliance', 'Formation or development of alliances between characters'),
        ('Betrayal', 'Events involving betrayal or broken trust between characters'),
        ('Strategy', 'Scenes focusing on strategic planning and tactical thinking'),
        ('Backstory', 'Revelations about character backgrounds and past events'),
        ('Tournament', 'Events related to organized gambling tournaments and competitions'),
        ('Life or Death', 'Situations where characters face life-threatening consequences')
      ON CONFLICT ("name") DO NOTHING;
    `);

    // Note: We cannot restore the original guide_tags associations since
    // we don't know which guides had which original tags
    // The down migration only restores the tags themselves
  }
}
