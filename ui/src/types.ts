export type UserRole = 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'STAFF';

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isPlatformTenant?: boolean;
  phone?: string;
  title?: string;
  department?: string | null;
  tenantId?: string;
  tenantCode: string;
  softwareName?: string;
  enabledModules?: string[];
};

export type LoginResponse = {
  accessToken: string;
  user: SessionUser;
};
