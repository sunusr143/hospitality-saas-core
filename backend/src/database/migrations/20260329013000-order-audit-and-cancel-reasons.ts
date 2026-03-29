import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderAuditAndCancelReasons20260329013000 implements MigrationInterface {
  name = 'OrderAuditAndCancelReasons20260329013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "restaurant_orders"
      ADD COLUMN IF NOT EXISTS "lastActionNote" text,
      ADD COLUMN IF NOT EXISTS "cancellationReason" text
    `);
    await queryRunner.query(`
      ALTER TABLE "bar_orders"
      ADD COLUMN IF NOT EXISTS "lastActionNote" text,
      ADD COLUMN IF NOT EXISTS "cancellationReason" text
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "restaurant_order_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventType" character varying(40) NOT NULL,
        "notes" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "tenantId" uuid NOT NULL,
        "orderId" uuid NOT NULL,
        "actorId" uuid,
        CONSTRAINT "PK_restaurant_order_events_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bar_order_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventType" character varying(40) NOT NULL,
        "notes" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "tenantId" uuid NOT NULL,
        "orderId" uuid NOT NULL,
        "actorId" uuid,
        CONSTRAINT "PK_bar_order_events_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "restaurant_order_events"
      ADD CONSTRAINT "FK_restaurant_order_events_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "restaurant_order_events"
      ADD CONSTRAINT "FK_restaurant_order_events_order"
      FOREIGN KEY ("orderId") REFERENCES "restaurant_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "restaurant_order_events"
      ADD CONSTRAINT "FK_restaurant_order_events_actor"
      FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "bar_order_events"
      ADD CONSTRAINT "FK_bar_order_events_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "bar_order_events"
      ADD CONSTRAINT "FK_bar_order_events_order"
      FOREIGN KEY ("orderId") REFERENCES "bar_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "bar_order_events"
      ADD CONSTRAINT "FK_bar_order_events_actor"
      FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bar_order_events" DROP CONSTRAINT IF EXISTS "FK_bar_order_events_actor"`);
    await queryRunner.query(`ALTER TABLE "bar_order_events" DROP CONSTRAINT IF EXISTS "FK_bar_order_events_order"`);
    await queryRunner.query(`ALTER TABLE "bar_order_events" DROP CONSTRAINT IF EXISTS "FK_bar_order_events_tenant"`);
    await queryRunner.query(`ALTER TABLE "restaurant_order_events" DROP CONSTRAINT IF EXISTS "FK_restaurant_order_events_actor"`);
    await queryRunner.query(`ALTER TABLE "restaurant_order_events" DROP CONSTRAINT IF EXISTS "FK_restaurant_order_events_order"`);
    await queryRunner.query(`ALTER TABLE "restaurant_order_events" DROP CONSTRAINT IF EXISTS "FK_restaurant_order_events_tenant"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bar_order_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "restaurant_order_events"`);
    await queryRunner.query(`ALTER TABLE "bar_orders" DROP COLUMN IF EXISTS "cancellationReason", DROP COLUMN IF EXISTS "lastActionNote"`);
    await queryRunner.query(`ALTER TABLE "restaurant_orders" DROP COLUMN IF EXISTS "cancellationReason", DROP COLUMN IF EXISTS "lastActionNote"`);
  }
}
