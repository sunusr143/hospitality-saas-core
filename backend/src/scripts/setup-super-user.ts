import 'dotenv/config';
import * as bcrypt from 'bcrypt';

import dataSource from '../database/data-source';
import { Tenant } from '../modules/tenants/tenant.entity';
import { User } from '../modules/users/user.entity';
import { UserRole } from '../modules/users/enums/user-role.enum';

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = '') {
  return process.env[name]?.trim() || fallback;
}

async function main() {
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);

  const tenantCode = (process.env.SUPER_USER_TENANT_CODE?.trim() || process.env.PRODUCTION_TENANT_CODE?.trim() || '').toUpperCase();
  const platformLoginCode = (process.env.SUPER_USER_LOGIN_CODE?.trim() || 'SUPERADMIN').toUpperCase();
  const email = required('SUPER_USER_EMAIL').toLowerCase();
  const password = required('SUPER_USER_PASSWORD');
  const fullName = optional('SUPER_USER_NAME', 'Platform Super User');
  const title = optional('SUPER_USER_TITLE', 'Platform Owner');
  const phone = optional('SUPER_USER_PHONE', null as unknown as string);
  const addressLine1 = optional('SUPER_USER_ADDRESS', null as unknown as string);

  if (!tenantCode) {
    throw new Error('Missing required environment variable: SUPER_USER_TENANT_CODE or PRODUCTION_TENANT_CODE');
  }

  const tenant = await tenantRepo.findOne({ where: { code: tenantCode } });

  if (!tenant) {
    throw new Error(`Tenant not found for code: ${tenantCode}. Run setup:production first or provide SUPER_USER_TENANT_CODE.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let superUser = await userRepo.findOne({
    where: { email },
    relations: ['tenant'],
  });

  if (!superUser) {
    superUser = userRepo.create({
      tenant,
      fullName,
      email,
      password: passwordHash,
      phone,
      title,
      department: 'Administration',
      addressLine1,
      photoUrl: null,
      notes: 'Platform-level super user for module unlock, recovery, and software administration.',
      role: UserRole.SUPER_USER,
      isActive: true,
    });
  } else {
    superUser.tenant = tenant;
    superUser.fullName = fullName;
    superUser.password = passwordHash;
    superUser.phone = phone;
    superUser.title = title;
    superUser.department = 'Administration';
    superUser.addressLine1 = addressLine1;
    superUser.role = UserRole.SUPER_USER;
    superUser.isActive = true;
  }

  await userRepo.save(superUser);

  console.log('Super user bootstrap complete.');
  console.log(`Tenant: ${tenant.code} · ${tenant.name}`);
  console.log(`Platform login code: ${platformLoginCode}`);
  console.log(`Super user login: ${email}`);
  console.log('Next step: log in and configure Super User Recovery from Hotel Settings.');

  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Super user bootstrap failed:', error);
  process.exit(1);
});
