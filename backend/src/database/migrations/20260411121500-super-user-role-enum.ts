import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuperUserRoleEnum20260411121500 implements MigrationInterface {
  name = 'SuperUserRoleEnum20260411121500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'SUPER_USER'
            AND enumtypid = 'users_role_enum'::regtype
        ) THEN
          ALTER TYPE users_role_enum ADD VALUE 'SUPER_USER';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL enum value removal is intentionally not automated here.
  }
}
