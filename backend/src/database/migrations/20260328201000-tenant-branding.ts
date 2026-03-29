import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantBranding20260328201000 implements MigrationInterface {
  name = 'TenantBranding20260328201000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "softwareName" character varying(120) NOT NULL DEFAULT 'Hospitality'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN IF EXISTS "softwareName"`,
    );
  }
}
