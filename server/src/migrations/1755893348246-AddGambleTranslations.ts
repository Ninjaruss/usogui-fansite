import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddGambleTranslations1755893348246 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create gamble_translation table
        await queryRunner.createTable(new Table({
            name: "gamble_translation",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "gambleId",
                    type: "int"
                },
                {
                    name: "languageCode",
                    type: "varchar"
                },
                {
                    name: "name",
                    type: "varchar"
                },
                {
                    name: "rules",
                    type: "text"
                },
                {
                    name: "winCondition",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Add foreign key constraint
        await queryRunner.createForeignKey("gamble_translation", new TableForeignKey({
            columnNames: ["gambleId"],
            referencedColumnNames: ["id"],
            referencedTableName: "gamble",
            onDelete: "CASCADE"
        }));

        // Create index for language code and gambleId
        await queryRunner.query(`CREATE INDEX "IDX_GAMBLE_TRANSLATION_LANG_GAMBLE" ON "gamble_translation" ("languageCode", "gambleId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the indices first
        await queryRunner.query(`DROP INDEX "IDX_GAMBLE_TRANSLATION_LANG_GAMBLE"`);

        // Drop foreign keys
        const table = await queryRunner.getTable("gamble_translation");
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("gambleId") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("gamble_translation", foreignKey);
            }
        }

        // Drop the table
        await queryRunner.dropTable("gamble_translation");
    }
}
