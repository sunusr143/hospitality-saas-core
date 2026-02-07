import { MigrationInterface, QueryRunner } from 'typeorm';

export class QloappsModules20260207000300 implements MigrationInterface {
  name = 'QloappsModules20260207000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rate_calendar (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "ratePlanId" uuid,
        "roomType" varchar(80) NOT NULL,
        date date NOT NULL,
        "baseRate" decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_rate_calendar_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_rate_calendar_rate_plan FOREIGN KEY ("ratePlanId") REFERENCES rate_plans(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_calendar_unique ON rate_calendar ("tenantId", "roomType", date)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS availability_calendar (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "roomType" varchar(80) NOT NULL,
        date date NOT NULL,
        "totalRooms" int NOT NULL,
        "availableRooms" int NOT NULL,
        "stopSell" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_availability_calendar_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_calendar_unique ON availability_calendar ("tenantId", "roomType", date)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restriction_calendar (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "roomType" varchar(80) NOT NULL,
        date date NOT NULL,
        "minStay" int NOT NULL DEFAULT 1,
        "maxStay" int,
        "closedToArrival" boolean NOT NULL DEFAULT false,
        "closedToDeparture" boolean NOT NULL DEFAULT false,
        closed boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_restriction_calendar_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_restriction_calendar_unique ON restriction_calendar ("tenantId", "roomType", date)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS room_move_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "reservationId" uuid NOT NULL,
        "fromRoomId" uuid NOT NULL,
        "toRoomId" uuid NOT NULL,
        "movedById" uuid NOT NULL,
        reason text,
        "movedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_room_move_logs_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_room_move_logs_reservation FOREIGN KEY ("reservationId") REFERENCES reservations(id) ON DELETE RESTRICT,
        CONSTRAINT fk_room_move_logs_from_room FOREIGN KEY ("fromRoomId") REFERENCES rooms(id) ON DELETE RESTRICT,
        CONSTRAINT fk_room_move_logs_to_room FOREIGN KEY ("toRoomId") REFERENCES rooms(id) ON DELETE RESTRICT,
        CONSTRAINT fk_room_move_logs_moved_by FOREIGN KEY ("movedById") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_out_of_order_status_enum') THEN
          CREATE TYPE room_out_of_order_status_enum AS ENUM ('ACTIVE','RESOLVED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS room_out_of_order (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "roomId" uuid NOT NULL,
        "reportedById" uuid NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date,
        reason text,
        status room_out_of_order_status_enum NOT NULL DEFAULT 'ACTIVE',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_out_of_order_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_out_of_order_room FOREIGN KEY ("roomId") REFERENCES rooms(id) ON DELETE RESTRICT,
        CONSTRAINT fk_out_of_order_reported_by FOREIGN KEY ("reportedById") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurant_categories (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(120) NOT NULL,
        description text,
        "sortOrder" int NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_restaurant_categories_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_categories_tenant_name ON restaurant_categories ("tenantId", name)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurant_items (
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
        CONSTRAINT fk_restaurant_items_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_restaurant_items_category FOREIGN KEY ("categoryId") REFERENCES restaurant_categories(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_restaurant_items_tenant_name ON restaurant_items ("tenantId", name)'
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restaurant_orders_status_enum') THEN
          CREATE TYPE restaurant_orders_status_enum AS ENUM ('OPEN','POSTED','CANCELLED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurant_orders (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "createdById" uuid NOT NULL,
        "folioId" uuid,
        currency varchar(10) NOT NULL,
        subtotal decimal(10,2) NOT NULL,
        "taxRate" decimal(5,4) NOT NULL DEFAULT 0,
        "taxAmount" decimal(10,2) NOT NULL,
        total decimal(10,2) NOT NULL,
        status restaurant_orders_status_enum NOT NULL DEFAULT 'OPEN',
        "postedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_restaurant_orders_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_restaurant_orders_created_by FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_restaurant_orders_folio FOREIGN KEY ("folioId") REFERENCES folios(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurant_order_items (
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
        CONSTRAINT fk_restaurant_order_items_order FOREIGN KEY ("orderId") REFERENCES restaurant_orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_restaurant_order_items_item FOREIGN KEY ("itemId") REFERENCES restaurant_items(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tax_rates (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        name varchar(120) NOT NULL,
        rate decimal(5,4) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_tax_rates_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_rates_tenant_name ON tax_rates ("tenantId", name)'
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_entries_type_enum') THEN
          CREATE TYPE ledger_entries_type_enum AS ENUM ('CHARGE','PAYMENT','REFUND','ADJUSTMENT');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "folioId" uuid,
        "createdById" uuid,
        type ledger_entries_type_enum NOT NULL,
        amount decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        reference varchar(120),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_ledger_entries_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_ledger_entries_folio FOREIGN KEY ("folioId") REFERENCES folios(id) ON DELETE SET NULL,
        CONSTRAINT fk_ledger_entries_created_by FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_sync_type_enum') THEN
          CREATE TYPE channel_sync_type_enum AS ENUM ('RATES','AVAILABILITY','INVENTORY');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_sync_status_enum') THEN
          CREATE TYPE channel_sync_status_enum AS ENUM ('PENDING','SUCCESS','FAILED');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS channel_sync_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "channelName" varchar(80) NOT NULL,
        type channel_sync_type_enum NOT NULL,
        status channel_sync_status_enum NOT NULL,
        payload jsonb,
        response jsonb,
        "errorMessage" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_channel_sync_logs_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS channel_sync_logs');
    await queryRunner.query('DROP TYPE IF EXISTS channel_sync_status_enum');
    await queryRunner.query('DROP TYPE IF EXISTS channel_sync_type_enum');
    await queryRunner.query('DROP TABLE IF EXISTS ledger_entries');
    await queryRunner.query('DROP TYPE IF EXISTS ledger_entries_type_enum');
    await queryRunner.query('DROP TABLE IF EXISTS tax_rates');
    await queryRunner.query('DROP TABLE IF EXISTS restaurant_order_items');
    await queryRunner.query('DROP TABLE IF EXISTS restaurant_orders');
    await queryRunner.query('DROP TYPE IF EXISTS restaurant_orders_status_enum');
    await queryRunner.query('DROP TABLE IF EXISTS restaurant_items');
    await queryRunner.query('DROP TABLE IF EXISTS restaurant_categories');
    await queryRunner.query('DROP TABLE IF EXISTS room_out_of_order');
    await queryRunner.query('DROP TYPE IF EXISTS room_out_of_order_status_enum');
    await queryRunner.query('DROP TABLE IF EXISTS room_move_logs');
    await queryRunner.query('DROP TABLE IF EXISTS restriction_calendar');
    await queryRunner.query('DROP TABLE IF EXISTS availability_calendar');
    await queryRunner.query('DROP TABLE IF EXISTS rate_calendar');
  }
}
