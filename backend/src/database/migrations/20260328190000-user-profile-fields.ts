import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserProfileFields20260328190000 implements MigrationInterface {
  name = 'UserProfileFields20260328190000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone varchar(30),
      ADD COLUMN IF NOT EXISTS title varchar(80),
      ADD COLUMN IF NOT EXISTS department varchar(80),
      ADD COLUMN IF NOT EXISTS "addressLine1" varchar(160),
      ADD COLUMN IF NOT EXISTS "photoUrl" text,
      ADD COLUMN IF NOT EXISTS notes text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS notes,
      DROP COLUMN IF EXISTS "photoUrl",
      DROP COLUMN IF EXISTS "addressLine1",
      DROP COLUMN IF EXISTS department,
      DROP COLUMN IF EXISTS title,
      DROP COLUMN IF EXISTS phone
    `);
  }
}
