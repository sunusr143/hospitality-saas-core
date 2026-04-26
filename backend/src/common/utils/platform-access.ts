import { UserRole } from '../../modules/users/enums/user-role.enum';

export function resolvePlatformTenantCode(): string {
  return (
    process.env.SUPER_USER_TENANT_CODE?.trim()
    || process.env.PRODUCTION_TENANT_CODE?.trim()
    || 'HOTEL_MAIN'
  ).toUpperCase();
}

export function resolvePlatformLoginCode(): string {
  return (process.env.SUPER_USER_LOGIN_CODE?.trim() || 'SUPERADMIN').toUpperCase();
}

export function isPlatformTenantCode(code?: string | null): boolean {
  return String(code ?? '').trim().toUpperCase() === resolvePlatformTenantCode();
}

export function isPlatformLoginCode(code?: string | null): boolean {
  return String(code ?? '').trim().toUpperCase() === resolvePlatformLoginCode();
}

export function hasPlatformAccess(user?: {
  role?: UserRole;
  isPlatformTenant?: boolean;
}): boolean {
  return user?.role === UserRole.SUPER_USER || user?.isPlatformTenant === true;
}
