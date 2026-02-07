import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentsReconciliation20260207000700 implements MigrationInterface {
  name = 'PaymentsReconciliation20260207000700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_reconciliations (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "transactionId" uuid NOT NULL,
        "reconciledById" uuid NOT NULL,
        "reconciliationReference" varchar(120) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_payment_recon_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE RESTRICT,
        CONSTRAINT fk_payment_recon_transaction FOREIGN KEY ("transactionId") REFERENCES payment_transactions(id) ON DELETE RESTRICT,
        CONSTRAINT fk_payment_recon_user FOREIGN KEY ("reconciledById") REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS payment_reconciliations');
  }
}
