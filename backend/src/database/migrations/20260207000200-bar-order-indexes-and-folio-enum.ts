import { MigrationInterface, QueryRunner } from 'typeorm';

export class BarOrderIndexesAndFolioEnum20260207000200 implements MigrationInterface {
  name = 'BarOrderIndexesAndFolioEnum20260207000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'folio_line_items_type_enum') THEN
          ALTER TYPE folio_line_items_type_enum ADD VALUE IF NOT EXISTS 'BAR_CHARGE';
          ALTER TYPE folio_line_items_type_enum ADD VALUE IF NOT EXISTS 'FNB_CHARGE';
        END IF;
      END $$;
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_bar_orders_status ON bar_orders (status)'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_bar_orders_created_at ON bar_orders ("createdAt")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_bar_orders_created_at');
    await queryRunner.query('DROP INDEX IF EXISTS idx_bar_orders_status');
  }
}
