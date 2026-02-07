import { MigrationInterface, QueryRunner } from 'typeorm';

export class FrontdeskTaxesNotificationsPermissions20260207000600 implements MigrationInterface {
  name = 'FrontdeskTaxesNotificationsPermissions20260207000600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS guest_documents (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "guestId" uuid NOT NULL,
        "verifiedById" uuid NOT NULL,
        "documentType" varchar(40) NOT NULL,
        "documentNumber" varchar(80) NOT NULL,
        "expiryDate" date,
        verified boolean NOT NULL DEFAULT true,
        notes text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_guest_documents_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_guest_documents_guest FOREIGN KEY ("guestId") REFERENCES guests(id) ON DELETE RESTRICT,
        CONSTRAINT fk_guest_documents_verified_by FOREIGN KEY ("verifiedById") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "reservationId" uuid NOT NULL,
        "collectedById" uuid NOT NULL,
        amount decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        reference varchar(120),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_deposits_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_deposits_reservation FOREIGN KEY ("reservationId") REFERENCES reservations(id) ON DELETE RESTRICT,
        CONSTRAINT fk_deposits_collected_by FOREIGN KEY ("collectedById") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tax_rules (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(120) NOT NULL,
        rate decimal(5,4) NOT NULL,
        "appliesTo" varchar(80),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_tax_rules_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_rules_tenant_name ON tax_rules ("tenantId", name)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "recipientId" uuid,
        channel varchar(30) NOT NULL,
        subject varchar(200) NOT NULL,
        body text NOT NULL,
        sent boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_notifications_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_notifications_recipient FOREIGN KEY ("recipientId") REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        code varchar(120) UNIQUE NOT NULL,
        description varchar(200) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          CREATE TYPE user_role_enum AS ENUM ('ADMIN','STAFF');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        role user_role_enum NOT NULL,
        "permissionCode" varchar(120) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS role_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS permissions');
    await queryRunner.query('DROP TABLE IF EXISTS notifications');
    await queryRunner.query('DROP INDEX IF EXISTS idx_tax_rules_tenant_name');
    await queryRunner.query('DROP TABLE IF EXISTS tax_rules');
    await queryRunner.query('DROP TABLE IF EXISTS deposits');
    await queryRunner.query('DROP TABLE IF EXISTS guest_documents');
  }
}
