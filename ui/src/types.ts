export type UserRole = 'ADMIN' | 'STAFF';

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
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
