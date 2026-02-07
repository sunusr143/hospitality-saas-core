import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoreModules20260207000400 implements MigrationInterface {
  name = 'MoreModules20260207000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      ALTER TABLE housekeeping_tasks
      ADD COLUMN IF NOT EXISTS "dueAt" timestamptz
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS housekeeping_inspections (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "roomId" uuid NOT NULL,
        "inspectorId" uuid NOT NULL,
        passed boolean NOT NULL DEFAULT true,
        notes text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_housekeeping_inspections_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_housekeeping_inspections_room FOREIGN KEY ("roomId") REFERENCES rooms(id) ON DELETE RESTRICT,
        CONSTRAINT fk_housekeeping_inspections_inspector FOREIGN KEY ("inspectorId") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status_enum') THEN
          CREATE TYPE maintenance_status_enum AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CANCELLED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "roomId" uuid NOT NULL,
        "reportedById" uuid NOT NULL,
        "assignedToId" uuid,
        title varchar(160) NOT NULL,
        description text,
        status maintenance_status_enum NOT NULL DEFAULT 'OPEN',
        "resolvedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_maintenance_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_maintenance_room FOREIGN KEY ("roomId") REFERENCES rooms(id) ON DELETE RESTRICT,
        CONSTRAINT fk_maintenance_reported_by FOREIGN KEY ("reportedById") REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_maintenance_assigned_to FOREIGN KEY ("assignedToId") REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS corporate_accounts (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(160) NOT NULL,
        "contactName" varchar(150),
        "contactEmail" varchar(150),
        "contactPhone" varchar(40),
        "billingAddress" varchar(120),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_corporate_accounts_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_corporate_accounts_tenant_name ON corporate_accounts ("tenantId", name)'
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
          CREATE TYPE payment_status_enum AS ENUM ('PENDING','CAPTURED','FAILED','REFUNDED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "createdById" uuid,
        "folioId" uuid,
        provider varchar(40) NOT NULL,
        "providerReference" varchar(80) NOT NULL,
        amount decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        status payment_status_enum NOT NULL,
        metadata jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_payment_transactions_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_payment_transactions_created_by FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_payment_transactions_folio FOREIGN KEY ("folioId") REFERENCES folios(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS channel_integrations (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "channelName" varchar(80) NOT NULL,
        config jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_channel_integrations_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_integrations_tenant_name ON channel_integrations ("tenantId", "channelName")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_channel_integrations_tenant_name');
    await queryRunner.query('DROP TABLE IF EXISTS channel_integrations');
    await queryRunner.query('DROP TABLE IF EXISTS payment_transactions');
    await queryRunner.query('DROP TYPE IF EXISTS payment_status_enum');
    await queryRunner.query('DROP INDEX IF EXISTS idx_corporate_accounts_tenant_name');
    await queryRunner.query('DROP TABLE IF EXISTS corporate_accounts');
    await queryRunner.query('DROP TABLE IF EXISTS maintenance_requests');
    await queryRunner.query('DROP TYPE IF EXISTS maintenance_status_enum');
    await queryRunner.query('DROP TABLE IF EXISTS housekeeping_inspections');
  }
}
