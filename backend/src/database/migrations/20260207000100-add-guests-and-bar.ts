import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestsAndBar20260207000100 implements MigrationInterface {
  name = 'AddGuestsAndBar20260207000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "createdById" uuid NOT NULL,
        "fullName" varchar(150) NOT NULL,
        email varchar(150) NOT NULL,
        phone varchar(30),
        "dateOfBirth" date,
        nationality varchar(80),
        "idType" varchar(40),
        "idNumber" varchar(60),
        "addressLine1" varchar(120),
        "addressLine2" varchar(120),
        city varchar(80),
        state varchar(80),
        "postalCode" varchar(20),
        country varchar(80),
        vip boolean NOT NULL DEFAULT false,
        "marketingOptIn" boolean NOT NULL DEFAULT false,
        notes text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_guests_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_guests_created_by FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_tenant_email ON guests ("tenantId", email)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_guests_tenant_phone ON guests ("tenantId", phone)`
    );

    await queryRunner.query(`
      ALTER TABLE reservations
      ADD COLUMN IF NOT EXISTS "guestId" uuid
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations ("guestId")`
    );
    await queryRunner.query(`
      ALTER TABLE reservations
      ADD CONSTRAINT fk_reservations_guest
      FOREIGN KEY ("guestId") REFERENCES guests(id)
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bar_categories (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(120) NOT NULL,
        description text,
        "sortOrder" int NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_bar_categories_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_bar_categories_tenant_name ON bar_categories ("tenantId", name)`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bar_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "categoryId" uuid NOT NULL,
        name varchar(150) NOT NULL,
        description text,
        sku varchar(40),
        price decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        "taxRate" decimal(5,4) NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_bar_items_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_bar_items_category FOREIGN KEY ("categoryId") REFERENCES bar_categories(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_bar_items_tenant_name ON bar_items ("tenantId", name)`
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bar_orders_status_enum') THEN
          CREATE TYPE bar_orders_status_enum AS ENUM ('OPEN','POSTED','CANCELLED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bar_orders (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "createdById" uuid NOT NULL,
        "folioId" uuid,
        currency varchar(10) NOT NULL,
        subtotal decimal(10,2) NOT NULL,
        "taxRate" decimal(5,4) NOT NULL DEFAULT 0,
        "taxAmount" decimal(10,2) NOT NULL,
        total decimal(10,2) NOT NULL,
        status bar_orders_status_enum NOT NULL DEFAULT 'OPEN',
        "postedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_bar_orders_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_bar_orders_created_by FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_bar_orders_folio FOREIGN KEY ("folioId") REFERENCES folios(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bar_order_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "itemId" uuid NOT NULL,
        "nameSnapshot" varchar(150) NOT NULL,
        "unitPrice" decimal(10,2) NOT NULL,
        quantity int NOT NULL,
        "totalAmount" decimal(10,2) NOT NULL,
        notes text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_bar_order_items_order FOREIGN KEY ("orderId") REFERENCES bar_orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_bar_order_items_item FOREIGN KEY ("itemId") REFERENCES bar_items(id) ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS bar_order_items');
    await queryRunner.query('DROP TABLE IF EXISTS bar_orders');
    await queryRunner.query('DROP TYPE IF EXISTS bar_orders_status_enum');
    await queryRunner.query('DROP TABLE IF EXISTS bar_items');
    await queryRunner.query('DROP TABLE IF EXISTS bar_categories');

    await queryRunner.query(
      'ALTER TABLE reservations DROP CONSTRAINT IF EXISTS fk_reservations_guest'
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_reservations_guest_id'
    );
    await queryRunner.query('ALTER TABLE reservations DROP COLUMN IF EXISTS "guestId"');

    await queryRunner.query('DROP TABLE IF EXISTS guests');
  }
}
