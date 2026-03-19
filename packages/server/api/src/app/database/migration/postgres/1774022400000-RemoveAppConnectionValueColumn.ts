import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAppConnectionValueColumn1774022400000 implements MigrationInterface {
    name = 'RemoveAppConnectionValueColumn1774022400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "app_connection" DROP COLUMN IF EXISTS "value"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "app_connection" ADD COLUMN "value" jsonb')
    }
}
