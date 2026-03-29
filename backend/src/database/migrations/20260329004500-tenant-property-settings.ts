import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantPropertySettings20260329004500 implements MigrationInterface {
  name = 'TenantPropertySettings20260329004500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "contactEmail" character varying(160),
      ADD COLUMN IF NOT EXISTS "contactPhone" character varying(30),
      ADD COLUMN IF NOT EXISTS "addressLine1" character varying(160),
      ADD COLUMN IF NOT EXISTS "city" character varying(80),
      ADD COLUMN IF NOT EXISTS "country" character varying(80),
      ADD COLUMN IF NOT EXISTS "currencyCode" character varying(3) NOT NULL DEFAULT 'INR',
      ADD COLUMN IF NOT EXISTS "timezone" character varying(80) NOT NULL DEFAULT 'Asia/Kolkata',
      ADD COLUMN IF NOT EXISTS "checkInTime" character varying(5) NOT NULL DEFAULT '14:00',
      ADD COLUMN IF NOT EXISTS "checkOutTime" character varying(5) NOT NULL DEFAULT '11:00'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "checkOutTime",
      DROP COLUMN IF EXISTS "checkInTime",
      DROP COLUMN IF EXISTS "timezone",
      DROP COLUMN IF EXISTS "currencyCode",
      DROP COLUMN IF EXISTS "country",
      DROP COLUMN IF EXISTS "city",
      DROP COLUMN IF EXISTS "addressLine1",
      DROP COLUMN IF EXISTS "contactPhone",
      DROP COLUMN IF EXISTS "contactEmail"
    `);
  }
}
