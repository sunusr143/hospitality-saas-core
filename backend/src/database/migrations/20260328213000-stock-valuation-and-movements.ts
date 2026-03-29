import { MigrationInterface, QueryRunner } from 'typeorm';

export class StockValuationAndMovements20260328213000 implements MigrationInterface {
  name = 'StockValuationAndMovements20260328213000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_items"
       ADD COLUMN IF NOT EXISTS "unitCost" decimal(10,2) NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS "reorderLevel" integer NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS "supplierId" uuid`,
    );

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('PURCHASE', 'ISSUE', 'ADJUSTMENT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."stock_movements_type_enum" NOT NULL,
        "quantity" integer NOT NULL,
        "unitCost" decimal(10,2),
        "reference" character varying(120),
        "notes" character varying(255),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "tenantId" uuid NOT NULL,
        "stockItemId" uuid NOT NULL,
        CONSTRAINT "PK_stock_movements_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stock_movements_tenant" ON "stock_movements" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stock_movements_stock_item" ON "stock_movements" ("stockItemId")`);
    await queryRunner.query(
      `ALTER TABLE "stock_items"
       ADD CONSTRAINT "FK_stock_items_supplier"
       FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    ).catch(() => undefined);
    await queryRunner.query(
      `ALTER TABLE "stock_movements"
       ADD CONSTRAINT "FK_stock_movements_tenant"
       FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    ).catch(() => undefined);
    await queryRunner.query(
      `ALTER TABLE "stock_movements"
       ADD CONSTRAINT "FK_stock_movements_stock_item"
       FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    ).catch(() => undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements"`);
    await queryRunner.query(`ALTER TABLE "stock_items" DROP CONSTRAINT IF EXISTS "FK_stock_items_supplier"`);
    await queryRunner.query(
      `ALTER TABLE "stock_items"
       DROP COLUMN IF EXISTS "supplierId",
       DROP COLUMN IF EXISTS "unitCost",
       DROP COLUMN IF EXISTS "reorderLevel"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."stock_movements_type_enum"`);
  }
}
