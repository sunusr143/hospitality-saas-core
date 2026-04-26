import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderClosedStatus20260425180000 implements MigrationInterface {
  name = 'OrderClosedStatus20260425180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'CLOSED'
            AND enumtypid = 'bar_orders_status_enum'::regtype
        ) THEN
          ALTER TYPE "bar_orders_status_enum" ADD VALUE 'CLOSED';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'CLOSED'
            AND enumtypid = 'restaurant_orders_status_enum'::regtype
        ) THEN
          ALTER TYPE "restaurant_orders_status_enum" ADD VALUE 'CLOSED';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // Enum values are left in place because PostgreSQL does not support removing them safely.
  }
}
