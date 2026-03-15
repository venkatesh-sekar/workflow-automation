import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddApiKeyHashToProject1772027509097 implements MigrationInterface {
    name = 'AddApiKeyHashToProject1772027509097'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "apiKeyHash" character varying
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_api_key_hash"
            ON "project" ("apiKeyHash")
            WHERE "apiKeyHash" IS NOT NULL AND deleted IS NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_api_key_hash"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "apiKeyHash"
        `)
    }
}
