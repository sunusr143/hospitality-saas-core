import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantEnabledModules20260329001000 implements MigrationInterface {
  name = 'TenantEnabledModules20260329001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "enabledModules" text NOT NULL
      DEFAULT '["dashboard","property","users","frontdesk","reservations","rooms","guests","restaurant","bar","housekeeping","maintenance","operations","finance","accounting","billing","reports","imports"]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "enabledModules"
    `);
  }
}
