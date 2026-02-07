import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtraModules20260207000800 implements MigrationInterface {
  name = 'ExtraModules20260207000800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'spa_appointment_status_enum') THEN
          CREATE TYPE spa_appointment_status_enum AS ENUM ('SCHEDULED','COMPLETED','CANCELLED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS spa_services (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(150) NOT NULL,
        "durationMinutes" int NOT NULL,
        price decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_spa_services_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS spa_appointments (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "serviceId" uuid NOT NULL,
        "guestId" uuid NOT NULL,
        "staffId" uuid,
        "startAt" timestamptz NOT NULL,
        "endAt" timestamptz NOT NULL,
        status spa_appointment_status_enum NOT NULL DEFAULT 'SCHEDULED',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_spa_appointments_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_spa_appointments_service FOREIGN KEY ("serviceId") REFERENCES spa_services(id) ON DELETE RESTRICT,
        CONSTRAINT fk_spa_appointments_guest FOREIGN KEY ("guestId") REFERENCES guests(id) ON DELETE RESTRICT,
        CONSTRAINT fk_spa_appointments_staff FOREIGN KEY ("staffId") REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(160) NOT NULL,
        "startAt" timestamptz NOT NULL,
        "endAt" timestamptz NOT NULL,
        "expectedGuests" int NOT NULL DEFAULT 0,
        notes text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_events_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS laundry_orders (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "guestId" uuid NOT NULL,
        description varchar(160) NOT NULL,
        amount decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        completed boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_laundry_orders_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_laundry_orders_guest FOREIGN KEY ("guestId") REFERENCES guests(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(160) NOT NULL,
        "contactEmail" varchar(120),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_suppliers_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stock_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(160) NOT NULL,
        quantity int NOT NULL DEFAULT 0,
        unit varchar(40) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_stock_items_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loyalty_accounts (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "guestId" uuid NOT NULL,
        points int NOT NULL DEFAULT 0,
        tier varchar(40) NOT NULL DEFAULT 'BASIC',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_loyalty_accounts_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_loyalty_accounts_guest FOREIGN KEY ("guestId") REFERENCES guests(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS staff_shifts (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "staffId" uuid NOT NULL,
        "startAt" timestamptz NOT NULL,
        "endAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_staff_shifts_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_staff_shifts_user FOREIGN KEY ("staffId") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS transport_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "guestId" uuid NOT NULL,
        "pickupLocation" varchar(200) NOT NULL,
        "dropoffLocation" varchar(200) NOT NULL,
        "pickupAt" timestamptz NOT NULL,
        status varchar(40) NOT NULL DEFAULT 'PENDING',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_transport_requests_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_transport_requests_guest FOREIGN KEY ("guestId") REFERENCES guests(id) ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS transport_requests');
    await queryRunner.query('DROP TABLE IF EXISTS staff_shifts');
    await queryRunner.query('DROP TABLE IF EXISTS loyalty_accounts');
    await queryRunner.query('DROP TABLE IF EXISTS stock_items');
    await queryRunner.query('DROP TABLE IF EXISTS suppliers');
    await queryRunner.query('DROP TABLE IF EXISTS laundry_orders');
    await queryRunner.query('DROP TABLE IF EXISTS events');
    await queryRunner.query('DROP TABLE IF EXISTS spa_appointments');
    await queryRunner.query('DROP TABLE IF EXISTS spa_services');
    await queryRunner.query('DROP TYPE IF EXISTS spa_appointment_status_enum');
  }
}
