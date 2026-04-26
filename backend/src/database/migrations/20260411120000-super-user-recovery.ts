import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuperUserRecovery20260411120000 implements MigrationInterface {
  name = 'SuperUserRecovery20260411120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "superUserRecoveryQuestionOne" varchar(160),
      ADD COLUMN IF NOT EXISTS "superUserRecoveryQuestionTwo" varchar(160),
      ADD COLUMN IF NOT EXISTS "superUserRecoveryAnswerHashOne" varchar(255),
      ADD COLUMN IF NOT EXISTS "superUserRecoveryAnswerHashTwo" varchar(255),
      ADD COLUMN IF NOT EXISTS "superUserRecoveryKeyHash" varchar(255),
      ADD COLUMN IF NOT EXISTS "superUserRecoveryConfiguredAt" timestamp
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_super_user_recovery_configured_at"
      ON users ("superUserRecoveryConfiguredAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_super_user_recovery_configured_at"
    `);
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS "superUserRecoveryConfiguredAt",
      DROP COLUMN IF EXISTS "superUserRecoveryKeyHash",
      DROP COLUMN IF EXISTS "superUserRecoveryAnswerHashTwo",
      DROP COLUMN IF EXISTS "superUserRecoveryAnswerHashOne",
      DROP COLUMN IF EXISTS "superUserRecoveryQuestionTwo",
      DROP COLUMN IF EXISTS "superUserRecoveryQuestionOne"
    `);
  }
}
