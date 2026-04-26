import { LoginResponse } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? 'http://localhost:3000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function readErrorMessage(res: Response) {
  const text = await res.text();

  if (!text) {
    return `Request failed with status ${res.status}`;
  }

  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(', ');
    }
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // Fall back to the raw response text when it is not JSON.
  }

  return text;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && options.token) {
    localStorage.removeItem('hotel_session');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function login(tenantCode: string, email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { tenantCode, email, password },
  });
}

export async function getSuperUserRecoveryQuestions(email: string) {
  return request<{ questionOne: string; questionTwo: string }>('/auth/super-user/recovery/questions', {
    method: 'POST',
    body: { email },
  });
}

export async function resetSuperUserPassword(body: {
  email: string;
  answerOne: string;
  answerTwo: string;
  recoveryKey: string;
  newPassword: string;
}) {
  return request<{ success: boolean; message: string }>('/auth/super-user/recovery/reset', {
    method: 'POST',
    body,
  });
}

export async function configureSuperUserRecovery(
  token: string,
  body: {
    questionOne: string;
    answerOne: string;
    questionTwo: string;
    answerTwo: string;
    recoveryKey: string;
  },
) {
  return request<{ success: boolean; configuredAt: string }>('/auth/super-user/recovery/setup', {
    method: 'POST',
    token,
    body,
  });
}

export async function getTenantBranding(code: string) {
  return request<any>(`/public/tenants/${encodeURIComponent(code)}/branding`);
}

export async function getReservations(token: string) {
  return request<any[]>('/reservations', { token });
}

export async function createReservation(
  token: string,
  body: {
    roomId: string;
    guestId?: string;
    guestFullName?: string;
    guestEmail?: string;
    guestPhone?: string;
    checkInDate: string;
    checkOutDate: string;
    notes?: string;
  },
) {
  return request<any>('/reservations', {
    method: 'POST',
    token,
    body,
  });
}

export async function updateReservation(
  token: string,
  reservationId: string,
  body: {
    roomId?: string;
    guestId?: string;
    guestFullName?: string;
    guestEmail?: string;
    guestPhone?: string;
    checkInDate?: string;
    checkOutDate?: string;
    notes?: string;
  },
) {
  return request<any>(`/reservations/${reservationId}`, {
    method: 'PATCH',
    token,
    body,
  });
}

export async function updateReservationStatus(
  token: string,
  reservationId: string,
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED',
) {
  return request<any>(`/reservations/${reservationId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function getRooms(token: string) {
  return request<any[]>('/rooms', { token });
}

export async function updateRoomStatus(
  token: string,
  roomId: string,
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE',
) {
  return request<any>(`/rooms/${roomId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function getGuests(
  token: string,
  query?: { q?: string; vip?: 'true' | 'false' },
) {
  const params = new URLSearchParams();
  if (query?.q) params.set('q', query.q);
  if (query?.vip) params.set('vip', query.vip);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request<any[]>(`/guests${suffix}`, { token });
}

export async function getGuest(token: string, guestId: string) {
  return request<any>(`/guests/${guestId}`, { token });
}

export async function createGuest(
  token: string,
  body: {
    fullName: string;
    email: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    nationality?: string;
    idType?: string;
    idNumber?: string;
    country?: string;
    vip?: boolean;
    marketingOptIn?: boolean;
    notes?: string;
  },
) {
  return request<any>('/guests', {
    method: 'POST',
    token,
    body,
  });
}

export async function updateGuest(
  token: string,
  guestId: string,
  body: {
    fullName?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    nationality?: string;
    idType?: string;
    idNumber?: string;
    country?: string;
    vip?: boolean;
    marketingOptIn?: boolean;
    notes?: string;
  },
) {
  return request<any>(`/guests/${guestId}`, {
    method: 'PATCH',
    token,
    body,
  });
}

export async function getUsers(token: string) {
  return request<any[]>('/users', { token });
}

export async function createUser(
  token: string,
  body: {
    fullName: string;
    email: string;
    password: string;
    role: 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'STAFF';
    tenantCode: string;
    phone?: string;
    title?: string;
    department?: string;
    addressLine1?: string;
    photoUrl?: string;
    notes?: string;
  },
) {
  return request<any>('/users', {
    method: 'POST',
    token,
    body,
  });
}

export async function updateUserStatus(
  token: string,
  userId: string,
  isActive: boolean,
) {
  return request<any>(`/users/${userId}/status`, {
    method: 'PATCH',
    token,
    body: { isActive },
  });
}

export async function deleteUser(token: string, userId: string) {
  return request<any>(`/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getCurrentTenant(token: string) {
  return request<any>('/tenants/current', { token });
}

export async function updateCurrentTenant(
  token: string,
  body: {
    code?: string;
    name?: string;
    softwareName?: string;
    contactEmail?: string;
    contactPhone?: string;
    addressLine1?: string;
    city?: string;
    country?: string;
    currencyCode?: string;
    timezone?: string;
    checkInTime?: string;
    checkOutTime?: string;
    enabledModules?: string[];
  },
) {
  return request<any>('/tenants/current', {
    method: 'PATCH',
    token,
    body,
  });
}

export async function checkIn(token: string, reservationId: string) {
  return request('/frontdesk/checkin', {
    method: 'POST',
    token,
    body: { reservationId },
  });
}

export async function checkOut(token: string, reservationId: string) {
  return request('/frontdesk/checkout', {
    method: 'POST',
    token,
    body: { reservationId },
  });
}

export async function getFrontdeskDashboard(token: string, date?: string) {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : '';
  return request<any>(`/frontdesk/dashboard${suffix}`, { token });
}

export async function getFolioByReservation(token: string, reservationId: string) {
  return request<any>(`/folios/${reservationId}`, { token });
}

export async function postPayment(
  token: string,
  folioId: string,
  amount: number,
  method: string,
  reference?: string,
) {
  return request(`/folios/${folioId}/payments`, {
    method: 'POST',
    token,
    body: { amount, method, reference },
    headers: reference ? { 'Idempotency-Key': reference } : undefined,
  });
}

export async function generateInvoice(token: string, folioId: string, gstRate?: number) {
  return request(`/folios/${folioId}/invoice`, {
    method: 'POST',
    token,
    body: gstRate == null ? {} : { gstRate },
  });
}

export async function getSummary(token: string, folioId: string) {
  return request<any>(`/folios/${folioId}/summary`, { token });
}

export async function getKpis(token: string, from: string, to: string) {
  return request<any>(`/reports/kpis?from=${from}&to=${to}`, { token });
}

export async function getDailyKpis(token: string, from: string, to: string) {
  return request<any[]>(`/reports/kpis/daily?from=${from}&to=${to}`, { token });
}

export async function getRestaurantItems(token: string) {
  return request<any[]>('/restaurant/items', { token });
}

export async function getRestaurantCategories(token: string) {
  return request<any[]>('/restaurant/categories', { token });
}

export async function createRestaurantCategory(
  token: string,
  body: {
    name: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  return request<any>('/restaurant/categories', {
    method: 'POST',
    token,
    body,
  });
}

export async function createRestaurantItem(
  token: string,
  body: {
    categoryId: string;
    name: string;
    description?: string;
    sku?: string;
    price: number;
    currency: string;
    taxRate?: number;
    isActive?: boolean;
  },
) {
  return request<any>('/restaurant/items', {
    method: 'POST',
    token,
    body,
  });
}

export async function getRestaurantOrders(token: string) {
  return request<any[]>('/restaurant/orders', { token });
}

export async function createRestaurantOrder(
  token: string,
  body: {
    folioId?: string;
    taxRate?: number;
    postToFolio?: boolean;
    currency?: string;
    items: Array<{ itemId: string; quantity: number; notes?: string }>;
  },
) {
  return request<any>('/restaurant/orders', {
    method: 'POST',
    token,
    body,
  });
}

export async function postRestaurantOrder(token: string, orderId: string, folioId: string) {
  return request<any>(`/restaurant/orders/${orderId}/post`, {
    method: 'POST',
    token,
    body: { folioId },
  });
}

export async function closeRestaurantOrder(token: string, orderId: string) {
  return request<any>(`/restaurant/orders/${orderId}/close`, {
    method: 'POST',
    token,
  });
}

export async function getRestaurantOrder(token: string, orderId: string) {
  return request<any>(`/restaurant/orders/${orderId}`, { token });
}

export async function updateRestaurantOrder(
  token: string,
  orderId: string,
  body: {
    folioId?: string;
    taxRate?: number;
    postToFolio?: boolean;
    currency?: string;
    items: Array<{ itemId: string; quantity: number; notes?: string }>;
  },
) {
  return request<any>(`/restaurant/orders/${orderId}`, {
    method: 'PATCH',
    token,
    body,
  });
}

export async function cancelRestaurantOrder(
  token: string,
  orderId: string,
  reverseFolioCharge = false,
  reason?: string,
) {
  return request<any>(`/restaurant/orders/${orderId}/cancel`, {
    method: 'POST',
    token,
    body: { reverseFolioCharge, reason },
  });
}

export async function getBarItems(token: string) {
  return request<any[]>('/bar/items', { token });
}

export async function getBarCategories(token: string) {
  return request<any[]>('/bar/categories', { token });
}

export async function createBarCategory(
  token: string,
  body: {
    name: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  return request<any>('/bar/categories', {
    method: 'POST',
    token,
    body,
  });
}

export async function createBarItem(
  token: string,
  body: {
    categoryId: string;
    name: string;
    description?: string;
    sku?: string;
    price: number;
    currency: string;
    taxRate?: number;
    isActive?: boolean;
  },
) {
  return request<any>('/bar/items', {
    method: 'POST',
    token,
    body,
  });
}

export async function getBarOrders(token: string) {
  return request<any[]>('/bar/orders', { token });
}

export async function createBarOrder(
  token: string,
  body: {
    folioId?: string;
    taxRate?: number;
    postToFolio?: boolean;
    currency?: string;
    items: Array<{ itemId: string; quantity: number; notes?: string }>;
  },
) {
  return request<any>('/bar/orders', {
    method: 'POST',
    token,
    body,
  });
}

export async function postBarOrder(token: string, orderId: string, folioId: string) {
  return request<any>(`/bar/orders/${orderId}/post`, {
    method: 'POST',
    token,
    body: { folioId },
  });
}

export async function closeBarOrder(token: string, orderId: string) {
  return request<any>(`/bar/orders/${orderId}/close`, {
    method: 'POST',
    token,
  });
}

export async function getBarOrder(token: string, orderId: string) {
  return request<any>(`/bar/orders/${orderId}`, { token });
}

export async function updateBarOrder(
  token: string,
  orderId: string,
  body: {
    folioId?: string;
    taxRate?: number;
    postToFolio?: boolean;
    currency?: string;
    items: Array<{ itemId: string; quantity: number; notes?: string }>;
  },
) {
  return request<any>(`/bar/orders/${orderId}`, {
    method: 'PATCH',
    token,
    body,
  });
}

export async function cancelBarOrder(
  token: string,
  orderId: string,
  reverseFolioCharge = false,
  reason?: string,
) {
  return request<any>(`/bar/orders/${orderId}/cancel`, {
    method: 'POST',
    token,
    body: { reverseFolioCharge, reason },
  });
}

export async function getHousekeepingTasks(token: string) {
  return request<any[]>('/housekeeping', { token });
}

export async function createHousekeepingTask(
  token: string,
  body: { roomId: string; priority?: 'LOW' | 'NORMAL' | 'HIGH'; notes?: string },
) {
  return request<any>('/housekeeping', {
    method: 'POST',
    token,
    body,
  });
}

export async function updateHousekeepingStatus(
  token: string,
  taskId: string,
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
) {
  return request<any>(`/housekeeping/${taskId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function assignHousekeepingTask(
  token: string,
  taskId: string,
  body: { assignedToId: string; dueAt?: string },
) {
  return request<any>(`/housekeeping/${taskId}/assign`, {
    method: 'PATCH',
    token,
    body,
  });
}

export async function getMaintenanceRequests(token: string) {
  return request<any[]>('/maintenance', { token });
}

export async function createMaintenanceRequest(
  token: string,
  body: { roomId: string; title: string; description?: string },
) {
  return request<any>('/maintenance', {
    method: 'POST',
    token,
    body,
  });
}

export async function updateMaintenanceStatus(
  token: string,
  requestId: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED',
) {
  return request<any>(`/maintenance/${requestId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function assignMaintenanceRequest(
  token: string,
  requestId: string,
  body: { assignedToId: string },
) {
  return request<any>(`/maintenance/${requestId}/assign`, {
    method: 'PATCH',
    token,
    body,
  });
}

export async function getSpaServices(token: string) {
  return request<any[]>('/spa/services', { token });
}

export async function getSpaAppointments(token: string) {
  return request<any[]>('/spa/appointments', { token });
}

export async function getConciergeRequests(token: string) {
  return request<any[]>('/concierge/transport', { token });
}

export async function getLaundryOrders(token: string) {
  return request<any[]>('/laundry/orders', { token });
}

export async function getNotifications(token: string) {
  return request<any[]>('/notifications', { token });
}

export async function getEvents(token: string) {
  return request<any[]>('/events', { token });
}

export async function getSuppliers(token: string) {
  return request<any[]>('/procurement/suppliers', { token });
}

export async function getStockItems(token: string) {
  return request<any[]>('/procurement/stock', { token });
}

export async function getInventorySummary(token: string) {
  return request<any>('/procurement/stock/summary', { token });
}

export async function getStockMovements(token: string) {
  return request<any[]>('/procurement/stock/movements', { token });
}

export async function getShifts(token: string) {
  return request<any[]>('/hr/shifts', { token });
}

export async function getCorporateAccounts(token: string) {
  return request<any[]>('/corporate/accounts', { token });
}

export async function getChannelIntegrations(token: string) {
  return request<any[]>('/channel/integrations', { token });
}

export async function getChannelLogs(token: string) {
  return request<any[]>('/channel/logs', { token });
}

export async function getPaymentTransactions(token: string) {
  return request<any[]>('/payments/transactions', { token });
}

export async function getLedgerEntries(token: string, folioId?: string) {
  const suffix = folioId ? `?folioId=${encodeURIComponent(folioId)}` : '';
  return request<any[]>(`/accounting/ledger${suffix}`, { token });
}

export async function importRestaurantItems(
  token: string,
  file: File,
  defaultCurrency?: string,
  outletLabel?: string,
) {
  const formData = new FormData();
  formData.append('file', file);
  if (defaultCurrency) {
    formData.append('defaultCurrency', defaultCurrency);
  }
  if (outletLabel) {
    formData.append('outletLabel', outletLabel);
  }

  const res = await fetch(`${API_BASE}/restaurant/items/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem('hotel_session');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return res.json();
}

export async function importBarItems(
  token: string,
  file: File,
  defaultCurrency?: string,
) {
  const formData = new FormData();
  formData.append('file', file);
  if (defaultCurrency) {
    formData.append('defaultCurrency', defaultCurrency);
  }

  const res = await fetch(`${API_BASE}/bar/items/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem('hotel_session');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return res.json();
}
