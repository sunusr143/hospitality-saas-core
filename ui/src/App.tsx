import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  assignHousekeepingTask,
  assignMaintenanceRequest,
  cancelBarOrder,
  cancelRestaurantOrder,
  checkIn,
  checkOut,
  createBarOrder,
  createGuest,
  createHousekeepingTask,
  createMaintenanceRequest,
  createReservation,
  createRestaurantOrder,
  createUser,
  deleteUser,
  generateInvoice,
  getBarOrders,
  getBarOrder,
  getBarCategories,
  getBarItems,
  getChannelIntegrations,
  getChannelLogs,
  getConciergeRequests,
  getCorporateAccounts,
  getCurrentTenant,
  getDailyKpis,
  getEvents,
  getFolioByReservation,
  getGuest,
  getGuests,
  getHousekeepingTasks,
  getInventorySummary,
  getKpis,
  getLedgerEntries,
  getLaundryOrders,
  getMaintenanceRequests,
  getNotifications,
  getPaymentTransactions,
  getRooms,
  getShifts,
  getSpaAppointments,
  getSpaServices,
  getStockItems,
  getStockMovements,
  getSuppliers,
  getRestaurantOrders,
  getRestaurantOrder,
  getRestaurantCategories,
  getRestaurantItems,
  getReservations,
  getSummary,
  getTenantBranding,
  getUsers,
  importRestaurantItems,
  login,
  postBarOrder,
  postPayment,
  postRestaurantOrder,
  updateGuest,
  updateHousekeepingStatus,
  updateMaintenanceStatus,
  updateReservation,
  updateReservationStatus,
  updateBarOrder,
  updateRestaurantOrder,
  updateRoomStatus,
  updateCurrentTenant,
  updateUserStatus,
} from './api';
import { SessionUser, UserRole } from './types';

type SessionState = {
  token: string;
  user: SessionUser;
};

const APP_MODE = (import.meta.env.VITE_APP_MODE as string | undefined) ?? 'demo';
const IS_DEMO_MODE = APP_MODE === 'demo';

const HOTEL_DEPARTMENTS = [
  'Front Office',
  'Housekeeping',
  'Food & Beverage',
  'Kitchen',
  'Bar',
  'Maintenance',
  'Finance',
  'Sales',
  'Reservations',
  'Spa & Wellness',
  'Security',
  'Administration',
];

const PRODUCT_MODULES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Executive overview and hotel summary' },
  { key: 'property', label: 'Hotel Settings', description: 'Hotel identity, branding, and product setup' },
  { key: 'users', label: 'Team Management', description: 'Admin control over hotel users and staff' },
  { key: 'frontdesk', label: 'Front Desk', description: 'Arrival, check-in, check-out, and stay operations' },
  { key: 'reservations', label: 'Reservations', description: 'Bookings, edits, and reservation control' },
  { key: 'rooms', label: 'Rooms', description: 'Room inventory and room status view' },
  { key: 'guests', label: 'Guests', description: 'Guest CRM and stay history' },
  { key: 'restaurant', label: 'Restaurant', description: 'Dining menu and order management' },
  { key: 'bar', label: 'Bar Menu', description: 'Bar items and beverage orders' },
  { key: 'housekeeping', label: 'Housekeeping', description: 'Cleaning tasks and room readiness' },
  { key: 'maintenance', label: 'Maintenance', description: 'Engineering issues and room repairs' },
  { key: 'operations', label: 'Operations', description: 'Operational module overview for admins' },
  { key: 'finance', label: 'Finance', description: 'Commercial, payments, suppliers, and inventory' },
  { key: 'accounting', label: 'Accounting', description: 'Ledger entries and accounts review' },
  { key: 'billing', label: 'Billing', description: 'Guest folios, invoices, and payments' },
  { key: 'reports', label: 'Finance Reports', description: 'KPI, occupancy, and daily financial review' },
  { key: 'imports', label: 'Data Import', description: 'Master data imports for rollout and onboarding' },
];

const DEPARTMENT_ACCESS_MATRIX = [
  {
    department: 'Front Office',
    modules: ['Front Desk', 'Reservations', 'Rooms', 'Guests', 'Notifications'],
    actions: 'Manage arrivals, reservations, and guest-facing stay activity.',
  },
  {
    department: 'Housekeeping',
    modules: ['Rooms', 'Housekeeping', 'Laundry'],
    actions: 'Update room readiness, cleaning status, and laundry workflows.',
  },
  {
    department: 'Maintenance',
    modules: ['Rooms', 'Maintenance'],
    actions: 'Handle room issues, assignments, and resolution updates.',
  },
  {
    department: 'Food & Beverage',
    modules: ['Restaurant', 'Bar Menu'],
    actions: 'Manage menus, create orders, and post outlet charges.',
  },
  {
    department: 'Finance',
    modules: ['Finance', 'Accounting', 'Billing', 'Finance Reports'],
    actions: 'Review payments, ledger, stock value, and financial closing.',
  },
  {
    department: 'Administration',
    modules: ['All enabled modules'],
    actions: 'Full property-wide oversight, setup, and exception handling.',
  },
];

const ACTION_CONTROL_HIGHLIGHTS = [
  ['Finance / Administration', 'Post payments, generate invoices, close folios, reconcile payments, manage procurement'],
  ['Housekeeping / Administration', 'Assign housekeeping tasks and submit inspections'],
  ['Maintenance / Administration', 'Assign maintenance requests'],
  ['Front Office / Reservations / Administration', 'Handle room moves and operational room status actions'],
  ['Administration only', 'Create users, control product setup, and manage hotel-wide configuration'],
];

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultReportRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 14);

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
}

function useSessionStorage() {
  const [session, setSession] = useState<SessionState | null>(() => {
    const raw = localStorage.getItem('hotel_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionState;
    } catch {
      return null;
    }
  });

  const save = (value: SessionState | null) => {
    setSession(value);
    if (value) {
      localStorage.setItem('hotel_session', JSON.stringify(value));
    } else {
      localStorage.removeItem('hotel_session');
    }
  };

  return { session, save };
}

function AuthGate({ session, children }: { session: SessionState | null; children: JSX.Element }) {
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function LoginPage({ onLogin }: { onLogin: (session: SessionState) => void }) {
  const [tenantCode, setTenantCode] = useState(IS_DEMO_MODE ? 'SUNU_DEMO' : '');
  const [email, setEmail] = useState(IS_DEMO_MODE ? 'admin@sunu.com' : '');
  const [password, setPassword] = useState(IS_DEMO_MODE ? 'admin123' : '');
  const [branding, setBranding] = useState<any | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadBranding() {
      try {
        setBranding(await getTenantBranding(tenantCode));
      } catch {
        setBranding(null);
      }
    }

    if (tenantCode.trim()) {
      void loadBranding();
    }
  }, [tenantCode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await login(email, password);
      onLogin({ token: res.accessToken, user: res.user });
      navigate('/frontdesk');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>{branding?.softwareName || 'Hospitality'}</h1>
        <p className="muted">{branding?.name || 'Hotel operations platform'}</p>
        <label>Hotel Code</label>
        <input value={tenantCode} onChange={(e) => setTenantCode(e.target.value.toUpperCase())} />
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {branding ? (
          <p className="muted">
            {branding.city ? `${branding.city}${branding.country ? `, ${branding.country}` : ''}` : ''}
            {branding.contactEmail ? ` · ${branding.contactEmail}` : ''}
          </p>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}

function Layout({
  session,
  onLogout,
  children,
}: {
  session: SessionState;
  onLogout: () => void;
  children: JSX.Element;
}) {
  const location = useLocation();
  const [frontdeskAlertCount, setFrontdeskAlertCount] = useState(0);

  useEffect(() => {
    async function loadFrontdeskAlerts() {
      if (!canAccessFrontOffice(session.user)) {
        setFrontdeskAlertCount(0);
        return;
      }

      try {
        const reservations = await getReservations(session.token);
        setFrontdeskAlertCount(
          reservations.filter((item) => ['PENDING', 'CONFIRMED'].includes(item.status)).length,
        );
      } catch {
        setFrontdeskAlertCount(0);
      }
    }

    void loadFrontdeskAlerts();
  }, [session.token, session.user, location.pathname]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>{session.user.softwareName || 'Hospitality'}</h2>
          <span className="pill">PMS</span>
        </div>
        <p>{session.user.fullName}</p>
        <p className="muted">
          {session.user.title || session.user.role}
          {session.user.department ? ` · ${session.user.department}` : ''}
        </p>
        <nav>
          {hasModule(session.user, 'dashboard') ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/dashboard">Dashboard</NavLink> : null}
          {hasModule(session.user, 'property') && canAccessFinance(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/property">Property</NavLink> : null}
          {hasModule(session.user, 'users') && session.user.role === 'ADMIN' ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/users">Users</NavLink> : null}
          {canAccessFrontOffice(session.user) ? (
            <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/frontdesk">
              <span className="nav-link-label">
                <span>Front Desk</span>
                {frontdeskAlertCount > 0 ? <span className="nav-alert pulse">{frontdeskAlertCount}</span> : null}
              </span>
            </NavLink>
          ) : null}
          {hasModule(session.user, 'reservations') && canAccessFrontOffice(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/reservations">Reservations</NavLink> : null}
          {hasModule(session.user, 'rooms') && (canAccessFrontOffice(session.user) || canAccessHousekeeping(session.user) || canAccessMaintenance(session.user)) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/rooms">Rooms</NavLink> : null}
          {hasModule(session.user, 'rooms') && (canAccessFrontOffice(session.user) || canAccessHousekeeping(session.user) || canAccessMaintenance(session.user)) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/room-board">Live Room Board</NavLink> : null}
          {hasModule(session.user, 'guests') && canAccessFrontOffice(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/guests">Guests</NavLink> : null}
          {canAccessRestaurant(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/restaurant">Restaurant</NavLink> : null}
          {canAccessBar(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/bar">Bar Menu</NavLink> : null}
          {canAccessHousekeeping(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/housekeeping">Housekeeping</NavLink> : null}
          {canAccessMaintenance(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/maintenance">Maintenance</NavLink> : null}
          {hasModule(session.user, 'operations') && session.user.role === 'ADMIN' ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/operations">Operations</NavLink> : null}
          {canAccessFinance(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/commerce">Finance</NavLink> : null}
          {hasModule(session.user, 'accounting') && canAccessFinance(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/accounting">Accounting</NavLink> : null}
          {hasModule(session.user, 'billing') && canAccessFinance(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/billing">Billing</NavLink> : null}
          {hasModule(session.user, 'reports') && canAccessFinance(session.user) ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/reports">Finance Reports</NavLink> : null}
          {hasModule(session.user, 'imports') && session.user.role === 'ADMIN' ? <NavLink className={({ isActive }) => (isActive ? 'is-active' : '')} to="/imports">Data Import</NavLink> : null}
        </nav>
        <button className="ghost sidebar-logout" onClick={onLogout}>
          Logout
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function formatCurrency(value: number | string, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString();
}

function toneForStatus(status: string) {
  if (['AVAILABLE', 'COMPLETED', 'RESOLVED', 'SUCCESS', 'CAPTURED', 'ACTIVE'].includes(status)) {
    return 'success';
  }
  if (['OCCUPIED', 'IN_PROGRESS', 'PENDING', 'ASSIGNED', 'OPEN', 'SCHEDULED'].includes(status)) {
    return 'warning';
  }
  if (['MAINTENANCE', 'FAILED', 'CANCELLED'].includes(status)) {
    return 'danger';
  }
  return '';
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function formatUtcDate(value: string | Date) {
  const isoValue = typeof value === 'string' ? value : value.toISOString();
  const [year, month, day] = isoValue.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function departmentOf(user: SessionUser) {
  return (user.department ?? '').toLowerCase();
}

function hasModule(user: SessionUser, moduleKey: string) {
  const enabledModules = user.enabledModules ?? PRODUCT_MODULES.map((module) => module.key);
  return enabledModules.includes(moduleKey);
}

function canAccessFinance(user: SessionUser) {
  return hasModule(user, 'finance') && (user.role === 'ADMIN' || ['finance', 'administration'].includes(departmentOf(user)));
}

function canAccessFrontOffice(user: SessionUser) {
  return hasModule(user, 'frontdesk') && (user.role === 'ADMIN' || ['front office', 'reservations', 'administration'].includes(departmentOf(user)));
}

function canAccessHousekeeping(user: SessionUser) {
  return hasModule(user, 'housekeeping') && (user.role === 'ADMIN' || ['housekeeping', 'administration'].includes(departmentOf(user)));
}

function canAccessMaintenance(user: SessionUser) {
  return hasModule(user, 'maintenance') && (user.role === 'ADMIN' || ['maintenance', 'administration'].includes(departmentOf(user)));
}

function canAccessRestaurant(user: SessionUser) {
  return hasModule(user, 'restaurant') && (user.role === 'ADMIN' || ['food & beverage', 'kitchen', 'administration'].includes(departmentOf(user)));
}

function canAccessBar(user: SessionUser) {
  return hasModule(user, 'bar') && (user.role === 'ADMIN' || ['bar', 'food & beverage', 'administration'].includes(departmentOf(user)));
}

function nextDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const value = new Date();
    value.setDate(value.getDate() + index);
    return value.toISOString().slice(0, 10);
  });
}

function DashboardPage({ token }: { token: string }) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [restaurantItems, setRestaurantItems] = useState<any[]>([]);
  const [barItems, setBarItems] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any | null>(null);
  const [ops, setOps] = useState<Record<string, any[]>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const [
          currentTenant,
          reservationList,
          roomList,
          restaurantList,
          barList,
          housekeeping,
          maintenance,
          spaServices,
          spaAppointments,
          concierge,
          laundry,
          notifications,
          events,
          suppliers,
          stock,
          shifts,
        ] = await Promise.all([
          getCurrentTenant(token),
          getReservations(token),
          getRooms(token),
          getRestaurantItems(token),
          getBarItems(token),
          getHousekeepingTasks(token),
          getMaintenanceRequests(token),
          getSpaServices(token),
          getSpaAppointments(token),
          getConciergeRequests(token),
          getLaundryOrders(token),
          getNotifications(token),
          getEvents(token),
          getSuppliers(token),
          getStockItems(token),
          getShifts(token),
        ]);
        setTenant(currentTenant);
        setReservations(reservationList);
        setRooms(roomList);
        setRestaurantItems(restaurantList);
        setBarItems(barList);
        setOps({
          housekeeping,
          maintenance,
          spaServices,
          spaAppointments,
          concierge,
          laundry,
          notifications,
          events,
          suppliers,
          stock,
          shifts,
        });
      } catch (err: any) {
        setError(err.message ?? 'Failed to load dashboard');
      }
    }

    void load();
  }, [token]);

  const checkedIn = reservations.filter((item) => item.status === 'CHECKED_IN').length;
  const checkedOut = reservations.filter((item) => item.status === 'CHECKED_OUT').length;
  const confirmed = reservations.filter((item) => item.status === 'CONFIRMED').length;
  const totalReservations = reservations.length || 1;
  const suiteRooms = rooms.filter((room) => String(room.roomType).toUpperCase() === 'SUITE').length;
  const deluxeRooms = rooms.filter((room) => String(room.roomType).toUpperCase() === 'DELUXE').length;
  const occupancySegments = [
    { label: 'Confirmed', value: confirmed, tone: 'warning' },
    { label: 'In House', value: checkedIn, tone: 'success' },
    { label: 'Checked Out', value: checkedOut, tone: '' },
  ];
  const opsSummary = [
    ['Housekeeping', ops.housekeeping ?? []],
    ['Maintenance', ops.maintenance ?? []],
    ['Spa Services', ops.spaServices ?? []],
    ['Spa Appointments', ops.spaAppointments ?? []],
    ['Concierge', ops.concierge ?? []],
    ['Laundry', ops.laundry ?? []],
    ['Notifications', ops.notifications ?? []],
    ['Events', ops.events ?? []],
    ['Suppliers', ops.suppliers ?? []],
    ['Stock Items', ops.stock ?? []],
    ['Shifts', ops.shifts ?? []],
  ] as const;

  return (
    <section>
      <h1>Hotel Dashboard</h1>
      <p className="muted">
        {tenant ? `${tenant.name} · ${tenant.code}` : 'A live overview of hotel performance and operational activity.'}
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="stats-grid">
        <div className="stat-card stat-card-warning">
          <span className="stat-label">Confirmed Arrivals</span>
          <strong>{confirmed}</strong>
        </div>
        <div className="stat-card stat-card-success">
          <span className="stat-label">In-House Guests</span>
          <strong>{checkedIn}</strong>
        </div>
        <div className="stat-card stat-card-accent">
          <span className="stat-label">Checked-Out Today</span>
          <strong>{checkedOut}</strong>
        </div>
        <div className="stat-card stat-card-teal">
          <span className="stat-label">Restaurant Items</span>
          <strong>{restaurantItems.length}</strong>
        </div>
        <div className="stat-card stat-card-rose">
          <span className="stat-label">Bar Items</span>
          <strong>{barItems.length}</strong>
        </div>
        <div className="stat-card stat-card-indigo">
          <span className="stat-label">Total Rooms</span>
          <strong>{rooms.length}</strong>
        </div>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h3>Operations Coverage</h3>
            <p className="muted">
              {IS_DEMO_MODE
                ? 'Representative data across hotel departments.'
                : 'Live operational coverage across hotel departments.'}
            </p>
          </div>
        </div>
        <div className="stats-grid compact">
          {opsSummary.map(([label, items]) => (
            <div key={label} className="stat-card stat-card-soft">
              <span className="stat-label">{label}</span>
              <strong>{(items as any[]).length}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-grid">
        <div className="card">
          <h3>Occupancy Mix</h3>
          <div className="chart-list">
            {occupancySegments.map((segment) => (
              <div key={segment.label} className="chart-row">
                <div className="list-row dense">
                  <span>{segment.label}</span>
                  <strong>{segment.value}</strong>
                </div>
                <div className="chart-track">
                  <div
                    className={`chart-bar ${segment.tone}`}
                    style={{ width: `${(segment.value / totalReservations) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Talking Points</h3>
          <ul className="clean-list">
            <li>Front Desk check-in and checkout flows are live.</li>
            <li>Billing shows folio summary, payment posting, and invoice generation.</li>
            <li>Property layout: 12 rooms with 10 deluxe rooms and 2 suite rooms.</li>
            <li>Outlets: restaurant, AC bar, local bar, and coffee shop.</li>
            <li>Data Import supports hotel item master onboarding.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Operations Pressure</h3>
          <div className="chart-list">
            <div className="list-row dense">
              <span>Deluxe / Suite Mix</span>
              <strong>{deluxeRooms} / {suiteRooms}</strong>
            </div>
            {opsSummary.slice(0, 5).map(([label, items]) => (
              <div key={label} className="chart-row">
                <div className="list-row dense">
                  <span>{label}</span>
                  <strong>{items.length}</strong>
                </div>
                <div className="chart-track">
                  <div
                    className="chart-bar warning"
                    style={{ width: `${Math.min(items.length * 16, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Sample Guests</h3>
          <div className="stack-list">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="list-row">
                <div>
                  <strong>{reservation.guestName}</strong>
                  <div className="muted">
                    Room {reservation.room?.roomNumber} · {reservation.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PropertyPage({
  token,
  onTenantUpdated,
}: {
  token: string;
  onTenantUpdated: (data: { softwareName?: string; enabledModules?: string[] }) => void;
}) {
  const [tenant, setTenant] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [softwareName, setSoftwareName] = useState('Hospitality');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [enabledModules, setEnabledModules] = useState<string[]>(PRODUCT_MODULES.map((module) => module.key));
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Record<string, any[]>>({});

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const [
          currentTenant,
          housekeeping,
          maintenance,
          spaServices,
          spaAppointments,
          concierge,
          laundry,
          notifications,
          events,
          suppliers,
          stock,
          shifts,
        ] = await Promise.all([
          getCurrentTenant(token),
          getHousekeepingTasks(token),
          getMaintenanceRequests(token),
          getSpaServices(token),
          getSpaAppointments(token),
          getConciergeRequests(token),
          getLaundryOrders(token),
          getNotifications(token),
          getEvents(token),
          getSuppliers(token),
          getStockItems(token),
          getShifts(token),
        ]);

        setTenant(currentTenant);
        setName(currentTenant.name);
        setSoftwareName(currentTenant.softwareName ?? 'Hospitality');
        setContactEmail(currentTenant.contactEmail ?? '');
        setContactPhone(currentTenant.contactPhone ?? '');
        setAddressLine1(currentTenant.addressLine1 ?? '');
        setCity(currentTenant.city ?? '');
        setCountry(currentTenant.country ?? '');
        setCurrencyCode(currentTenant.currencyCode ?? 'INR');
        setTimezone(currentTenant.timezone ?? 'Asia/Kolkata');
        setCheckInTime(currentTenant.checkInTime ?? '14:00');
        setCheckOutTime(currentTenant.checkOutTime ?? '11:00');
        setEnabledModules(currentTenant.enabledModules ?? PRODUCT_MODULES.map((module) => module.key));
        setModules({
          housekeeping,
          maintenance,
          spaServices,
          spaAppointments,
          concierge,
          laundry,
          notifications,
          events,
          suppliers,
          stock,
          shifts,
        });
      } catch (err: any) {
        setError(err.message ?? 'Failed to load property');
      }
    }

    void load();
  }, [token]);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setStatus('');
      const updated = await updateCurrentTenant(token, { name });
      setTenant(updated);
      setStatus('Hotel name updated.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to update hotel name');
    } finally {
      setLoading(false);
    }
  }

  async function savePropertyProfile(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setStatus('');
      const updated = await updateCurrentTenant(token, {
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        currencyCode: currencyCode.trim().toUpperCase() || 'INR',
        timezone: timezone.trim() || 'Asia/Kolkata',
        checkInTime,
        checkOutTime,
      });
      setTenant(updated);
      setStatus('Property profile updated.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to update hotel profile');
    } finally {
      setLoading(false);
    }
  }

  async function saveConfiguration(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setStatus('');
      const updated = await updateCurrentTenant(token, {
        softwareName: softwareName.trim() || 'Hospitality',
        enabledModules,
      });
      setTenant(updated);
      setSoftwareName(updated.softwareName ?? 'Hospitality');
      setEnabledModules(updated.enabledModules ?? PRODUCT_MODULES.map((module) => module.key));
      onTenantUpdated({
        softwareName: updated.softwareName ?? 'Hospitality',
        enabledModules: updated.enabledModules ?? PRODUCT_MODULES.map((module) => module.key),
      });
      setStatus('Branding and product modules updated.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to update branding');
    } finally {
      setLoading(false);
    }
  }

  function toggleModule(moduleKey: string) {
    if (moduleKey === 'dashboard') {
      return;
    }

    setEnabledModules((current) =>
      current.includes(moduleKey)
        ? current.filter((value) => value !== moduleKey)
        : [...current, moduleKey],
    );
  }

  return (
    <section>
      <h1>Hotel Settings</h1>
      <p className="muted">Update the hotel identity, software branding, and rollout readiness from one place.</p>
      <div className="hero-grid">
        <div className="card">
          <h3>Hotel Identity</h3>
          <form className="import-form" onSubmit={saveName}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hotel name" />
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Name'}
            </button>
          </form>
          {tenant ? <p className="muted">Hotel code: {tenant.code}</p> : null}
          {status ? <p>{status}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
        <div className="card">
          <h3>Product Configuration</h3>
          <form className="import-form" onSubmit={saveConfiguration}>
            <input
              value={softwareName}
              onChange={(e) => setSoftwareName(e.target.value)}
              placeholder="Software name"
            />
            <button type="submit" disabled={loading}>Save Product Setup</button>
          </form>
          <p className="muted">This updates the app name and active hotel modules so the product fits each property.</p>
        </div>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h3>Property Profile</h3>
            <p className="muted">Core hotel details used for rollout, onboarding, billing context, and leadership reporting.</p>
          </div>
        </div>
        <form className="settings-grid" onSubmit={savePropertyProfile}>
          <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact email" />
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact phone" />
          <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Address" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
          <input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} placeholder="Currency" maxLength={3} />
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Timezone" />
          <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
          <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Property Profile'}
          </button>
        </form>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h3>Module Flexibility</h3>
            <p className="muted">Turn hotel modules on or off per property. Department access still applies on top.</p>
          </div>
        </div>
        <div className="stack-list">
          {PRODUCT_MODULES.map((module) => {
            const checked = enabledModules.includes(module.key);
            const disabled = module.key === 'dashboard';
            return (
              <label key={module.key} className="list-row">
                <div>
                  <strong>{module.label}</strong>
                  <div className="muted">{module.description}</div>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleModule(module.key)}
                />
              </label>
            );
          })}
        </div>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h3>Demo Readiness</h3>
            <p className="muted">
              {IS_DEMO_MODE
                ? 'Key controls ready for a walkthrough and testing.'
                : 'Key controls configured for hotel operations.'}
            </p>
          </div>
        </div>
        <div className="stats-grid compact">
          {[
            ['Brandable App Name', softwareName],
            ['Hotel Name', tenant?.name ?? '-'],
            ['Hotel Contact', contactEmail || contactPhone || '-'],
            ['Operating Time', `${checkInTime} / ${checkOutTime}`],
            ['Enabled Modules', enabledModules.length],
            ['Team Management', enabledModules.includes('users') ? 'Enabled' : 'Disabled'],
            ['Reservations', enabledModules.includes('reservations') ? 'Enabled' : 'Disabled'],
            ['F&B Orders', enabledModules.includes('restaurant') || enabledModules.includes('bar') ? 'Enabled' : 'Disabled'],
          ].map(([label, value]) => (
            <div key={label} className="stat-card">
              <span className="stat-label">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h3>Department Access Guide</h3>
            <p className="muted">Clear view of who should use which parts of the product.</p>
          </div>
        </div>
        <div className="stack-list">
          {DEPARTMENT_ACCESS_MATRIX.map((entry) => (
            <div key={entry.department} className="list-row align-start">
              <div>
                <strong>{entry.department}</strong>
                <div className="muted">{entry.actions}</div>
              </div>
              <div className="pill-group">
                {entry.modules.map((module) => (
                  <span key={module} className="pill">{module}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h3>Action Control Highlights</h3>
            <p className="muted">Sensitive actions now have backend protection on top of module visibility.</p>
          </div>
        </div>
        <div className="stack-list compact-list">
          {ACTION_CONTROL_HIGHLIGHTS.map(([owner, actions]) => (
            <div key={owner} className="list-row align-start">
              <strong>{owner}</strong>
              <span className="muted">{actions}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
          <h3>{IS_DEMO_MODE ? 'Demo Modules' : 'Operational Modules'}</h3>
          <div className="stack-list">
            {[
              ['Housekeeping', modules.housekeeping],
              ['Maintenance', modules.maintenance],
              ['Spa Services', modules.spaServices],
              ['Spa Appointments', modules.spaAppointments],
              ['Concierge', modules.concierge],
              ['Laundry', modules.laundry],
              ['Notifications', modules.notifications],
              ['Events', modules.events],
              ['Suppliers', modules.suppliers],
              ['Stock Items', modules.stock],
              ['Shifts', modules.shifts],
            ].map(([label, items]) => (
              <div key={label} className="list-row">
                <div>
                  <strong>{label}</strong>
                  <div className="muted">
                    {IS_DEMO_MODE
                      ? 'Seeded and available for walkthroughs'
                      : 'Configured and available for hotel operations'}
                  </div>
                </div>
                <span className="pill">{(items ?? []).length}</span>
              </div>
            ))}
          </div>
      </div>
    </section>
  );
}

function UsersPage({
  token,
  tenantCode,
}: {
  token: string;
  tenantCode: string;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Welcome@123');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Front Office');
  const [addressLine1, setAddressLine1] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const selectedDepartmentGuide = DEPARTMENT_ACCESS_MATRIX.find((entry) => entry.department === department);
  const activeUsers = users.filter((user) => user.isActive !== false);
  const inactiveUsers = users.filter((user) => user.isActive === false);

  async function refresh() {
    try {
      setError('');
      setUsers(await getUsers(token));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load users');
    }
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  async function onPhotoSelected(file: File | null) {
    if (!file) {
      setPhotoUrl('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setStatus('');
      await createUser(token, {
        fullName,
        email,
        password,
        role,
        tenantCode,
        phone: phone || undefined,
        title: title || undefined,
        department: department || undefined,
        addressLine1: addressLine1 || undefined,
        photoUrl: photoUrl || undefined,
        notes: notes || undefined,
      });
      setStatus('User created.');
      setFullName('');
      setEmail('');
      setPassword('Welcome@123');
      setPhone('');
      setTitle('');
      setDepartment('Front Office');
      setAddressLine1('');
      setNotes('');
      setPhotoUrl('');
      setRole('STAFF');
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  async function changeUserStatus(userId: string, isActive: boolean) {
    try {
      setError('');
      setStatus('');
      await updateUserStatus(token, userId, isActive);
      setStatus(isActive ? 'Team member activated.' : 'Team member deactivated.');
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update team member status');
    }
  }

  async function removeUser(userId: string) {
    try {
      setError('');
      setStatus('');
      await deleteUser(token, userId);
      setStatus('Team member removed.');
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to remove team member');
    }
  }

  return (
    <section>
      <h1>Team Management</h1>
      <p className="muted">Create, disable, and cleanly manage hotel staff accounts like a PMS admin console.</p>
      <div className="stats-grid compact">
        <div className="stat-card">
          <span className="stat-label">Active Team Members</span>
          <strong>{activeUsers.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Inactive Team Members</span>
          <strong>{inactiveUsers.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Departments Covered</span>
          <strong>{new Set(users.map((user) => user.department).filter(Boolean)).size}</strong>
        </div>
      </div>
      <div className="hero-grid">
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Add Team Member</h3>
              <p className="muted">Set up operational users with profile information.</p>
            </div>
            {photoUrl ? <img className="avatar-preview" src={photoUrl} alt="Preview" /> : <div className="avatar-placeholder">Photo</div>}
          </div>
          <form className="staff-form" onSubmit={submit}>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" />
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {HOTEL_DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Address" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Temporary password"
            />
            <select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'STAFF')}>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
            <label className="upload-field">
              <span className="muted">Profile photo</span>
              <input type="file" accept="image/*" onChange={(e) => void onPhotoSelected(e.target.files?.[0] ?? null)} />
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operational notes, shift preference, or onboarding remarks"
              rows={4}
            />
            {selectedDepartmentGuide ? (
              <div className="department-guide">
                <strong>{selectedDepartmentGuide.department} access</strong>
                <div className="muted">{selectedDepartmentGuide.actions}</div>
                <div className="pill-group">
                  {selectedDepartmentGuide.modules.map((module) => (
                    <span key={module} className="pill">{module}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
          {status ? <p>{status}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Current Team Members</h3>
              <p className="muted">Accounts currently available for this hotel.</p>
            </div>
            <span className="pill">{users.length}</span>
          </div>
          <div className="team-directory">
          <div className="stack-list">
            {users.map((user) => (
              <div key={user.id} className="list-row team-row">
                <div>
                  <div className="user-row">
                    {user.photoUrl ? (
                      <img className="avatar-preview small" src={user.photoUrl} alt={user.fullName} />
                    ) : (
                      <div className="avatar-placeholder small">{user.fullName?.slice(0, 1) || 'U'}</div>
                    )}
                    <div>
                      <strong>{user.fullName}</strong>
                      <div className="muted">{user.email}</div>
                      <div className="muted">
                        {[user.title, user.department, user.phone].filter(Boolean).join(' · ') || 'Profile details pending'}
                      </div>
                      {user.addressLine1 ? <div className="muted">{user.addressLine1}</div> : null}
                    </div>
                  </div>
                </div>
                <div className="team-actions">
                  <span className={`pill ${user.isActive === false ? 'danger' : 'success'}`}>
                    {user.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                  </span>
                  <span className="pill">{user.role}</span>
                  {user.isActive === false ? (
                    <button className="ghost" type="button" onClick={() => void changeUserStatus(user.id, true)}>
                      Activate
                    </button>
                  ) : (
                    <button className="ghost" type="button" onClick={() => void changeUserStatus(user.id, false)}>
                      Deactivate
                    </button>
                  )}
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => void removeUser(user.id)}
                    disabled={user.email === 'admin@sunu.com'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 ? <p className="muted">No users found.</p> : null}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoomsPage({ token }: { token: string }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        setRooms(await getRooms(token));
      } catch (err: any) {
        setError(err.message ?? 'Failed to load rooms');
      }
    }

    void load();
  }, [token]);

  return (
    <section>
      <h1>Rooms</h1>
      <p className="muted">Inventory board for the current hotel property.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="catalog-grid">
        {rooms.map((room) => (
          <div key={room.id} className={`card room-card room-card-${String(room.status).toLowerCase()}`}>
            <div className="section-head">
              <div>
                <h3>Room {room.roomNumber}</h3>
                <p className="muted">{room.roomType} · Capacity {room.capacity}</p>
              </div>
              <span className={`pill ${toneForStatus(room.status)}`}>{room.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoomBoardPage({ token, role }: { token: string; role: UserRole }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setError('');
      const [roomList, reservationList] = await Promise.all([
        getRooms(token),
        getReservations(token),
      ]);
      setRooms(roomList);
      setReservations(reservationList);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load room board');
    }
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  async function setStatus(roomId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE') {
    try {
      setError('');
      await updateRoomStatus(token, roomId, status);
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update room status');
    }
  }

  const today = toDateInputValue(new Date());
  const reservationByRoom = new Map<string, any>();

  for (const reservation of reservations) {
    const roomId = reservation.room?.id;
    if (!roomId || reservation.status === 'CANCELLED') continue;

    const current = reservationByRoom.get(roomId);
    const reservationPriority =
      reservation.status === 'CHECKED_IN'
        ? 3
        : reservation.checkInDate <= today && reservation.checkOutDate > today
          ? 2
          : reservation.status === 'CONFIRMED'
            ? 1
            : 0;
    const currentPriority =
      current?.status === 'CHECKED_IN'
        ? 3
        : current?.checkInDate <= today && current?.checkOutDate > today
          ? 2
          : current?.status === 'CONFIRMED'
            ? 1
            : 0;

    if (!current || reservationPriority > currentPriority) {
      reservationByRoom.set(roomId, reservation);
    }
  }

  return (
    <section>
      <div className="row">
        <h1>Live Room Board</h1>
        <button onClick={refresh}>Refresh</button>
      </div>
      <p className="muted">Live room inventory with guest context and quick status actions.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="catalog-grid">
        {rooms.map((room) => {
          const reservation = reservationByRoom.get(room.id);
          const hasCheckedInGuest = reservation?.status === 'CHECKED_IN';
          return (
            <div key={room.id} className={`card room-card room-card-${String(room.status).toLowerCase()}`}>
              <div className="section-head">
                <div>
                  <h3>Room {room.roomNumber}</h3>
                  <p className="muted">{room.roomType} · Capacity {room.capacity}</p>
                </div>
                <span className={`pill ${toneForStatus(room.status)}`}>{room.status}</span>
              </div>
              <div className="stack-list compact-list">
                <div className="list-row">
                  <span className="muted">Guest</span>
                  <strong>{reservation?.guestName ?? 'Vacant'}</strong>
                </div>
                <div className="list-row">
                  <span className="muted">Stay</span>
                  <strong>
                    {reservation
                      ? `${formatUtcDate(reservation.checkInDate)} to ${formatUtcDate(reservation.checkOutDate)}`
                      : '-'}
                  </strong>
                </div>
                <div className="list-row">
                  <span className="muted">Reservation</span>
                  <strong>{reservation?.status ?? 'None'}</strong>
                </div>
                <div className="list-row">
                  <span className="muted">Guest Contact</span>
                  <strong>{reservation?.guestEmail ?? reservation?.guest?.phone ?? '-'}</strong>
                </div>
                {role === 'ADMIN' ? (
                  <div className="row room-board-actions">
                    <button
                      className="ghost"
                      onClick={() => setStatus(room.id, 'AVAILABLE')}
                      disabled={hasCheckedInGuest}
                      title={hasCheckedInGuest ? 'Check out the guest from Front Desk before setting this room to available.' : ''}
                    >
                      Available
                    </button>
                    <button
                      className="ghost"
                      onClick={() => setStatus(room.id, 'OCCUPIED')}
                      disabled={!hasCheckedInGuest}
                      title={!hasCheckedInGuest ? 'Check in the guest from Front Desk before setting this room to occupied.' : ''}
                    >
                      Occupied
                    </button>
                    <button
                      className="ghost"
                      onClick={() => setStatus(room.id, 'MAINTENANCE')}
                      disabled={hasCheckedInGuest}
                      title={hasCheckedInGuest ? 'Check out the guest from Front Desk before moving this room to maintenance.' : ''}
                    >
                      Maintenance
                    </button>
                  </div>
                ) : null}
                {reservation?.status === 'CONFIRMED' ? (
                  <p className="muted room-board-note">This room is reserved for a confirmed arrival. Complete check-in from Front Desk to move the guest in-house.</p>
                ) : null}
                {!reservation ? (
                  <p className="muted room-board-note">Use Front Desk check-in to attach a guest stay before marking the room occupied.</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GuestsPage({ token }: { token: string }) {
  const [guests, setGuests] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [vipOnly, setVipOnly] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    nationality: '',
    idType: '',
    idNumber: '',
    country: '',
    notes: '',
    vip: false,
    marketingOptIn: false,
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function loadGuests() {
    try {
      setError('');
      const [guestList, reservationList] = await Promise.all([
        getGuests(token, {
          q: query || undefined,
          vip: vipOnly ? 'true' : undefined,
        }),
        getReservations(token),
      ]);
      setGuests(guestList);
      setReservations(reservationList);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load guests');
    }
  }

  useEffect(() => {
    void loadGuests();
  }, [query, token, vipOnly]);

  function selectGuest(guest: any) {
    setSelectedGuestId(guest.id);
    setForm({
      fullName: guest.fullName ?? '',
      email: guest.email ?? '',
      phone: guest.phone ?? '',
      addressLine1: guest.addressLine1 ?? '',
      city: guest.city ?? '',
      nationality: guest.nationality ?? '',
      idType: guest.idType ?? '',
      idNumber: guest.idNumber ?? '',
      country: guest.country ?? '',
      notes: guest.notes ?? '',
      vip: Boolean(guest.vip),
      marketingOptIn: Boolean(guest.marketingOptIn),
    });
    setStatus('');
  }

  function resetGuestForm() {
    setSelectedGuestId('');
    setForm({
      fullName: '',
      email: '',
      phone: '',
      addressLine1: '',
      city: '',
      nationality: '',
      idType: '',
      idNumber: '',
      country: '',
      notes: '',
      vip: false,
      marketingOptIn: false,
    });
    setStatus('');
  }

  async function submitGuest(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setStatus('');
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        addressLine1: form.addressLine1 || undefined,
        city: form.city || undefined,
        nationality: form.nationality || undefined,
        idType: form.idType || undefined,
        idNumber: form.idNumber || undefined,
        country: form.country || undefined,
        notes: form.notes || undefined,
        vip: form.vip,
        marketingOptIn: form.marketingOptIn,
      };

      if (selectedGuestId) {
        await updateGuest(token, selectedGuestId, payload);
        setStatus('Guest updated.');
      } else {
        const created = await createGuest(token, payload);
        setStatus('Guest created.');
        setSelectedGuestId(created.id);
      }

      await loadGuests();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save guest');
    }
  }

  return (
    <section>
      <h1>Guests</h1>
      <p className="muted">Guest profiles with editable preferences, identity details, and VIP markers.</p>
      <div className="row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guest name, email, or phone"
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={vipOnly}
            onChange={(e) => setVipOnly(e.target.checked)}
          />
          VIP only
        </label>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="hero-grid">
        <div className="card">
          <div className="section-head">
            <div>
              <h3>{selectedGuestId ? 'Edit Guest' : 'Add Guest'}</h3>
              <p className="muted">Maintain guest profiles for reservations and service modules.</p>
            </div>
            {selectedGuestId ? (
              <button className="ghost" onClick={resetGuestForm}>New Guest</button>
            ) : null}
          </div>
          <form className="staff-form" onSubmit={submitGuest}>
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Full name"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
            />
            <input
              value={form.addressLine1}
              onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
              placeholder="Address"
            />
            <input
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
            />
            <input
              value={form.nationality}
              onChange={(e) => setForm((prev) => ({ ...prev, nationality: e.target.value }))}
              placeholder="Nationality"
            />
            <input
              value={form.idType}
              onChange={(e) => setForm((prev) => ({ ...prev, idType: e.target.value }))}
              placeholder="ID type"
            />
            <input
              value={form.idNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, idNumber: e.target.value }))}
              placeholder="ID number"
            />
            <input
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
            />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.vip}
                onChange={(e) => setForm((prev) => ({ ...prev, vip: e.target.checked }))}
              />
              Mark as VIP guest
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.marketingOptIn}
                onChange={(e) => setForm((prev) => ({ ...prev, marketingOptIn: e.target.checked }))}
              />
              Marketing opt-in
            </label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Preferences, remarks, loyalty notes"
            />
            <button type="submit">{selectedGuestId ? 'Save Guest' : 'Create Guest'}</button>
          </form>
          {status ? <p>{status}</p> : null}
        </div>
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Guest Directory</h3>
              <p className="muted">Click a guest to view and update their profile.</p>
            </div>
            <span className="pill">{guests.length}</span>
          </div>
          <div className="stack-list">
            {guests.map((guest) => (
              <div key={guest.id} className="list-button">
                <div className="list-row">
                  <div>
                    <strong>{guest.fullName}</strong>
                    <div className="muted">{guest.email}</div>
                    <div className="muted">
                      {[guest.phone, guest.city, guest.country].filter(Boolean).join(' · ') || 'Profile details pending'}
                    </div>
                    <div className="muted">
                      {reservations.filter((reservation) => reservation.guest?.id === guest.id).length} reservations
                    </div>
                  </div>
                  <div className="row">
                    {guest.vip ? <span className="pill warning">VIP</span> : null}
                    <button type="button" className="ghost" onClick={() => selectGuest(guest)}>
                      Edit
                    </button>
                    <Link className="ghost-link" to={`/guests/${guest.id}`}>
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {guests.length === 0 ? <p className="muted">No guests found.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function GuestDetailPage({ token }: { token: string }) {
  const { guestId = '' } = useParams();
  const [guest, setGuest] = useState<any | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const [guestRecord, reservationList] = await Promise.all([
          getGuest(token, guestId),
          getReservations(token),
        ]);
        setGuest(guestRecord);
        setReservations(
          reservationList.filter(
            (reservation) =>
              reservation.guest?.id === guestId ||
              reservation.guestEmail === guestRecord.email,
          ),
        );
      } catch (err: any) {
        setError(err.message ?? 'Failed to load guest details');
      }
    }

    if (guestId) {
      void load();
    }
  }, [guestId, token]);

  return (
    <section>
      <div className="row">
        <h1>Guest Details</h1>
        <Link className="ghost-link" to="/guests">
          Back to Guests
        </Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {guest ? (
        <div className="hero-grid">
          <div className="card">
            <div className="section-head">
              <div>
                <h3>{guest.fullName}</h3>
                <p className="muted">{guest.email}</p>
              </div>
              {guest.vip ? <span className="pill warning">VIP</span> : <span className="pill">Standard</span>}
            </div>
            <div className="stack-list compact-list">
              <div className="list-row"><span className="muted">Phone</span><strong>{guest.phone || 'Not captured'}</strong></div>
              <div className="list-row"><span className="muted">Address</span><strong>{guest.addressLine1 || 'Not captured'}</strong></div>
              <div className="list-row"><span className="muted">Nationality</span><strong>{guest.nationality || 'Not captured'}</strong></div>
              <div className="list-row"><span className="muted">ID</span><strong>{[guest.idType, guest.idNumber].filter(Boolean).join(' · ') || 'Not captured'}</strong></div>
              <div className="list-row"><span className="muted">Marketing</span><strong>{guest.marketingOptIn ? 'Opted in' : 'Not opted in'}</strong></div>
            </div>
            {guest.notes ? <p className="muted">{guest.notes}</p> : null}
          </div>
          <div className="card">
            <div className="section-head">
              <div>
                <h3>Stay History</h3>
                <p className="muted">Reservations and room movements for this guest.</p>
              </div>
              <span className="pill">{reservations.length}</span>
            </div>
            <div className="stack-list">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="list-row">
                  <div>
                    <strong>Room {reservation.room?.roomNumber}</strong>
                    <div className="muted">
                      {dateLabel(reservation.checkInDate)} to {dateLabel(reservation.checkOutDate)}
                    </div>
                    <div className="muted">Created {formatDateTime(reservation.createdAt)}</div>
                  </div>
                  <span className={`pill ${toneForStatus(reservation.status)}`}>{reservation.status}</span>
                </div>
              ))}
              {reservations.length === 0 ? <p className="muted">No reservation history found for this guest.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReservationsPage({ token, role }: { token: string; role: UserRole }) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [editingReservationId, setEditingReservationId] = useState('');
  const [form, setForm] = useState({
    roomId: '',
    guestId: '',
    guestFullName: '',
    guestEmail: '',
    guestPhone: '',
    checkInDate: getDefaultReportRange().from,
    checkOutDate: getDefaultReportRange().to,
    notes: '',
  });

  async function refresh() {
    try {
      setError('');
      const [reservationList, roomList, guestList] = await Promise.all([
        getReservations(token),
        getRooms(token),
        getGuests(token),
      ]);
      setReservations(reservationList);
      setRooms(roomList);
      setGuests(guestList);
      if (!form.roomId) {
        const firstAvailable = roomList.find((room) => room.status === 'AVAILABLE');
        if (firstAvailable) {
          setForm((prev) => ({ ...prev, roomId: firstAvailable.id }));
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load reservations');
    }
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  function onGuestChange(guestId: string) {
    const guest = guests.find((item) => item.id === guestId);
    setForm((prev) => ({
      ...prev,
      guestId,
      guestFullName: guest ? guest.fullName : prev.guestFullName,
      guestEmail: guest ? guest.email : prev.guestEmail,
      guestPhone: guest ? guest.phone || '' : prev.guestPhone,
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setStatus('');
      if (!form.roomId) {
        throw new Error('Select a room first.');
      }
      if (!form.guestId && !form.guestFullName.trim()) {
        throw new Error('Guest name is required for walk-in reservations.');
      }
      if (form.checkOutDate <= form.checkInDate) {
        throw new Error('Check-out must be after check-in.');
      }

      const payload = {
        roomId: form.roomId,
        guestId: form.guestId || undefined,
        guestFullName: form.guestId ? undefined : form.guestFullName,
        guestEmail: form.guestEmail || undefined,
        guestPhone: form.guestPhone || undefined,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        notes: form.notes || undefined,
      };

      if (editingReservationId) {
        await updateReservation(token, editingReservationId, payload);
        setStatus('Reservation updated.');
      } else {
        await createReservation(token, payload);
        setStatus('Reservation created.');
      }
      setEditingReservationId('');
      setForm((prev) => ({
        ...prev,
        guestId: '',
        guestFullName: '',
        guestEmail: '',
        guestPhone: '',
        notes: '',
      }));
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save reservation');
    }
  }

  function editReservation(reservation: any) {
    setEditingReservationId(reservation.id);
    setForm({
      roomId: reservation.room?.id ?? '',
      guestId: reservation.guest?.id ?? '',
      guestFullName: reservation.guest?.id ? '' : reservation.guestName ?? '',
      guestEmail: reservation.guestEmail ?? '',
      guestPhone: reservation.guest?.phone ?? '',
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      notes: '',
    });
    setStatus('');
  }

  function resetForm() {
    setEditingReservationId('');
    setForm({
      roomId: rooms.find((room) => room.status === 'AVAILABLE')?.id ?? '',
      guestId: '',
      guestFullName: '',
      guestEmail: '',
      guestPhone: '',
      checkInDate: getDefaultReportRange().from,
      checkOutDate: getDefaultReportRange().to,
      notes: '',
    });
  }

  async function changeStatus(id: string, nextStatus: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED') {
    try {
      setError('');
      await updateReservationStatus(token, id, nextStatus);
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update reservation status');
    }
  }

  const gridDays = nextDays(7);
  const roomOrder = [...rooms].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

  return (
    <section>
      <h1>Reservations</h1>
      <p className="muted">Booking grid, live reservations, and create/edit workflows.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="hero-grid">
        <div className="card">
          <div className="section-head">
            <div>
              <h3>{editingReservationId ? 'Edit Reservation' : 'Create Reservation'}</h3>
              <p className="muted">Use an existing guest profile or add a walk-in booking.</p>
            </div>
            {editingReservationId ? (
              <button className="ghost" onClick={resetForm}>
                New Reservation
              </button>
            ) : null}
          </div>
          <form className="staff-form" onSubmit={submit}>
            <select value={form.roomId} onChange={(e) => setForm((prev) => ({ ...prev, roomId: e.target.value }))}>
              <option value="">Select room</option>
              {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} · {room.roomType} · {room.status}
                  </option>
                ))}
            </select>
            <select value={form.guestId} onChange={(e) => onGuestChange(e.target.value)}>
              <option value="">Walk-in / new guest</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.fullName} · {guest.email}
                </option>
              ))}
            </select>
            <input
              value={form.guestFullName}
              onChange={(e) => setForm((prev) => ({ ...prev, guestFullName: e.target.value }))}
              placeholder="Guest full name"
              disabled={Boolean(form.guestId)}
            />
            <input
              value={form.guestEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
              placeholder="Guest email"
            />
            <input
              value={form.guestPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, guestPhone: e.target.value }))}
              placeholder="Guest phone"
            />
            <input
              type="date"
              value={form.checkInDate}
              onChange={(e) => setForm((prev) => ({ ...prev, checkInDate: e.target.value }))}
            />
            <input
              type="date"
              value={form.checkOutDate}
              onChange={(e) => setForm((prev) => ({ ...prev, checkOutDate: e.target.value }))}
            />
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Arrival notes, preference, source, or booking remarks"
            />
            <button type="submit">{editingReservationId ? 'Save Reservation' : 'Create Reservation'}</button>
          </form>
          {status ? <p>{status}</p> : null}
        </div>
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Booking Grid</h3>
              <p className="muted">Next seven days by room.</p>
            </div>
          </div>
          <div className="booking-grid">
            <div className="booking-header">Room</div>
            {gridDays.map((day) => (
              <div key={day} className="booking-header">
                {dateLabel(day)}
              </div>
            ))}
            {roomOrder.map((room) => (
              <div key={room.id} className="booking-row">
                <div key={`${room.id}-label`} className="booking-room">
                  {room.roomNumber}
                </div>
                {gridDays.map((day) => {
                  const activeReservation = reservations.find(
                    (reservation) =>
                      reservation.room?.id === room.id &&
                      reservation.checkInDate <= day &&
                      reservation.checkOutDate > day &&
                      reservation.status !== 'CANCELLED',
                  );

                  return (
                    <div key={`${room.id}-${day}`} className={`booking-cell ${activeReservation ? 'busy' : 'free'}`}>
                      {activeReservation ? activeReservation.guestName.split(' ')[0] : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
          <div className="section-head">
            <div>
              <h3>Reservation List</h3>
              <p className="muted">Upcoming and in-house bookings for the hotel.</p>
            </div>
            <span className="pill">{reservations.length}</span>
          </div>
          <div className="stack-list">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="list-row">
                <div>
                  <strong>{reservation.guestName}</strong>
                  <div className="muted">
                    Room {reservation.room?.roomNumber} · {reservation.checkInDate} to {reservation.checkOutDate}
                  </div>
                  <div className="muted">{reservation.guestEmail}</div>
                </div>
                <div className="row">
                  <span className={`pill ${toneForStatus(reservation.status)}`}>{reservation.status}</span>
                  <button className="ghost" onClick={() => editReservation(reservation)}>Edit</button>
                  {role === 'ADMIN' ? (
                    <>
                      <button className="ghost" onClick={() => changeStatus(reservation.id, 'CONFIRMED')}>Confirm</button>
                      <button className="ghost" onClick={() => changeStatus(reservation.id, 'CANCELLED')}>Cancel</button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
      </div>
    </section>
  );
}

function HousekeepingPage({ token }: { token: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    roomId: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    notes: '',
  });

  async function refresh() {
    try {
      setError('');
      const [taskList, roomList, userList] = await Promise.all([
        getHousekeepingTasks(token),
        getRooms(token),
        getUsers(token),
      ]);
      setTasks(taskList);
      setRooms(roomList);
      setUsers(userList);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load housekeeping');
    }
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  async function createTask(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setStatus('');
      await createHousekeepingTask(token, {
        roomId: form.roomId,
        priority: form.priority,
        notes: form.notes || undefined,
      });
      setForm({ roomId: '', priority: 'MEDIUM', notes: '' });
      setStatus('Housekeeping task created.');
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create task');
    }
  }

  async function updateTaskStatus(
    id: string,
    status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  ) {
    try {
      setError('');
      await updateHousekeepingStatus(token, id, status);
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update task');
    }
  }

  async function assign(id: string, assignedToId: string) {
    try {
      setError('');
      await assignHousekeepingTask(token, id, { assignedToId });
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to assign task');
    }
  }

  const columns = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <section>
      <div className="row">
        <h1>Housekeeping</h1>
        <button onClick={refresh}>Refresh</button>
      </div>
      <p className="muted">Action board for room readiness and turnaround.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="card">
        <h3>Create Task</h3>
        <form className="staff-form" onSubmit={createTask}>
          <select value={form.roomId} onChange={(e) => setForm((prev) => ({ ...prev, roomId: e.target.value }))}>
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Room {room.roomNumber} · {room.status}
              </option>
            ))}
          </select>
          <select value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' }))}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Cleaning or inspection notes"
          />
          <button type="submit">Create Task</button>
        </form>
        {status ? <p>{status}</p> : null}
      </div>
      <div className="kanban-grid">
        {columns.map((column) => (
          <div key={column} className="card">
            <div className="section-head">
              <h3>{column.replace('_', ' ')}</h3>
              <span className={`pill ${toneForStatus(column)}`}>
                {tasks.filter((task) => task.status === column).length}
              </span>
            </div>
            <div className="stack-list">
              {tasks
                .filter((task) => task.status === column)
                .map((task) => (
                  <div key={task.id} className="mini-card">
                    <strong>Room {task.room?.roomNumber}</strong>
                    <div className="muted">
                      {task.priority} priority{task.assignedTo ? ` · ${task.assignedTo.fullName}` : ''}
                    </div>
                    {task.notes ? <p className="muted">{task.notes}</p> : null}
                    <select
                      value={task.assignedTo?.id ?? ''}
                      onChange={(e) => e.target.value && void assign(task.id, e.target.value)}
                    >
                      <option value="">Assign teammate</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} · {user.department || user.role}
                        </option>
                      ))}
                    </select>
                    <div className="row">
                      {column !== 'IN_PROGRESS' ? (
                        <button className="ghost" onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}>
                          Start
                        </button>
                      ) : null}
                      {column !== 'COMPLETED' ? (
                        <button className="ghost" onClick={() => updateTaskStatus(task.id, 'COMPLETED')}>
                          Complete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MaintenancePage({ token }: { token: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    roomId: '',
    title: '',
    description: '',
  });

  async function refresh() {
    try {
      setError('');
      const [requestList, roomList, userList] = await Promise.all([
        getMaintenanceRequests(token),
        getRooms(token),
        getUsers(token),
      ]);
      setRequests(requestList);
      setRooms(roomList);
      setUsers(userList);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load maintenance');
    }
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  async function createRequest(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setStatus('');
      await createMaintenanceRequest(token, {
        roomId: form.roomId,
        title: form.title,
        description: form.description || undefined,
      });
      setForm({ roomId: '', title: '', description: '' });
      setStatus('Maintenance request created.');
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create maintenance request');
    }
  }

  async function updateRequestStatus(
    id: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED',
  ) {
    try {
      setError('');
      await updateMaintenanceStatus(token, id, status);
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update maintenance');
    }
  }

  async function assign(id: string, assignedToId: string) {
    try {
      setError('');
      await assignMaintenanceRequest(token, id, { assignedToId });
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to assign maintenance request');
    }
  }

  return (
    <section>
      <div className="row">
        <h1>Maintenance</h1>
        <button onClick={refresh}>Refresh</button>
      </div>
      <p className="muted">Engineering queue with quick resolution actions.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="card">
        <h3>Create Maintenance Request</h3>
        <form className="staff-form" onSubmit={createRequest}>
          <select value={form.roomId} onChange={(e) => setForm((prev) => ({ ...prev, roomId: e.target.value }))}>
            <option value="">Select room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Room {room.roomNumber} · {room.status}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Issue title"
          />
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description and troubleshooting notes"
          />
          <button type="submit">Create Request</button>
        </form>
        {status ? <p>{status}</p> : null}
      </div>
      <div className="catalog-grid">
        {requests.map((request) => (
          <div key={request.id} className="card">
            <div className="section-head">
              <div>
                <h3>{request.title}</h3>
                <p className="muted">Room {request.room?.roomNumber}</p>
              </div>
              <span className={`pill ${toneForStatus(request.status)}`}>{request.status}</span>
            </div>
            {request.description ? <p className="muted">{request.description}</p> : null}
            <div className="muted">
              Reported by {request.reportedBy?.fullName ?? 'Unknown'}
              {request.assignedTo ? ` · Assigned to ${request.assignedTo.fullName}` : ''}
            </div>
            <select
              value={request.assignedTo?.id ?? ''}
              onChange={(e) => e.target.value && void assign(request.id, e.target.value)}
            >
              <option value="">Assign engineer</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} · {user.department || user.role}
                </option>
              ))}
            </select>
            <div className="row">
              <button className="ghost" onClick={() => updateRequestStatus(request.id, 'IN_PROGRESS')}>Start</button>
              <button className="ghost" onClick={() => updateRequestStatus(request.id, 'RESOLVED')}>Resolve</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModuleSection({
  title,
  subtitle,
  records,
  renderMeta,
}: {
  title: string;
  subtitle: string;
  records: any[];
  renderMeta?: (record: any) => string;
}) {
  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">{subtitle}</p>
        </div>
        <span className="pill">{records.length}</span>
      </div>
      <div className="stack-list">
        {records.length === 0 ? <p className="muted">No records available.</p> : null}
        {records.map((record) => (
          <div key={record.id} className="list-row">
            <div>
              <strong>
                {record.name ??
                  record.subject ??
                  record.title ??
                  record.description ??
                  record.channelName ??
                  record.providerReference}
              </strong>
              <div className="muted">{renderMeta ? renderMeta(record) : record.status ?? record.channel ?? ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationsPage({ token }: { token: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const [
          housekeeping,
          maintenance,
          spaServices,
          spaAppointments,
          concierge,
          laundry,
          notifications,
          events,
          suppliers,
          stock,
          shifts,
        ] = await Promise.all([
          getHousekeepingTasks(token),
          getMaintenanceRequests(token),
          getSpaServices(token),
          getSpaAppointments(token),
          getConciergeRequests(token),
          getLaundryOrders(token),
          getNotifications(token),
          getEvents(token),
          getSuppliers(token),
          getStockItems(token),
          getShifts(token),
        ]);
        setData({
          housekeeping,
          maintenance,
          spaServices,
          spaAppointments,
          concierge,
          laundry,
          notifications,
          events,
          suppliers,
          stock,
          shifts,
        });
      } catch (err: any) {
        setError(err.message ?? 'Failed to load operations modules');
      }
    }

    void load();
  }, [token]);

  return (
    <section>
      <h1>Operations</h1>
      <p className="muted">Back-of-house and guest-service modules for hotel operations.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="catalog-grid">
        <ModuleSection
          title="Housekeeping"
          subtitle="Room readiness and cleaning tasks"
          records={data.housekeeping ?? []}
          renderMeta={(record) => `Room ${record.room?.roomNumber ?? '-'} · ${record.status}`}
        />
        <ModuleSection
          title="Maintenance"
          subtitle="Open and in-progress engineering requests"
          records={data.maintenance ?? []}
          renderMeta={(record) => `Room ${record.room?.roomNumber ?? '-'} · ${record.status}`}
        />
        <ModuleSection
          title="Spa Services"
          subtitle="Sellable treatments"
          records={data.spaServices ?? []}
          renderMeta={(record) => `${record.durationMinutes} min · ${formatCurrency(record.price, record.currency)}`}
        />
        <ModuleSection
          title="Spa Appointments"
          subtitle="Booked guest experiences"
          records={data.spaAppointments ?? []}
          renderMeta={(record) => `${record.service?.name ?? 'Service'} · ${record.status}`}
        />
        <ModuleSection
          title="Concierge"
          subtitle="Transport and guest movement"
          records={data.concierge ?? []}
          renderMeta={(record) => `${record.pickupLocation} → ${record.dropoffLocation}`}
        />
        <ModuleSection
          title="Laundry"
          subtitle="Guest garment orders"
          records={data.laundry ?? []}
          renderMeta={(record) => `${formatCurrency(record.amount, record.currency)} · ${record.completed ? 'Completed' : 'Pending'}`}
        />
        <ModuleSection
          title="Notifications"
          subtitle="Guest and ops messaging"
          records={data.notifications ?? []}
          renderMeta={(record) => `${record.channel} · ${record.sent ? 'Sent' : 'Queued'}`}
        />
        <ModuleSection
          title="Events"
          subtitle="Banquets and meetings"
          records={data.events ?? []}
          renderMeta={(record) => `${record.expectedGuests} guests expected`}
        />
        <ModuleSection
          title="Suppliers"
          subtitle="Procurement master data"
          records={data.suppliers ?? []}
          renderMeta={(record) => record.contactEmail ?? 'No contact email'}
        />
        <ModuleSection
          title="Stock"
          subtitle="Inventory snapshot"
          records={data.stock ?? []}
          renderMeta={(record) => `${record.quantity} ${record.unit}`}
        />
        <ModuleSection
          title="Staff Shifts"
          subtitle="Live workforce schedule"
          records={data.shifts ?? []}
          renderMeta={(record) => record.staff?.fullName ?? 'Assigned staff'}
        />
      </div>
    </section>
  );
}

function CommercePage({ token }: { token: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [inventorySummary, setInventorySummary] = useState<any | null>(null);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const [corporate, integrations, logs, payments, suppliers, stock, summary, movements] = await Promise.all([
          getCorporateAccounts(token),
          getChannelIntegrations(token),
          getChannelLogs(token),
          getPaymentTransactions(token),
          getSuppliers(token),
          getStockItems(token),
          getInventorySummary(token),
          getStockMovements(token),
        ]);
        setData({ corporate, integrations, logs, payments, suppliers, stock });
        setInventorySummary(summary);
        setStockMovements(movements);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load commerce modules');
      }
    }

    void load();
  }, [token]);

  const successfulPayments = (data.payments ?? []).filter((payment) =>
    ['CAPTURED', 'SUCCESS', 'SETTLED'].includes(payment.status),
  );
  const paymentVolume = successfulPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const stockUnits = Number(inventorySummary?.totalUnits ?? 0);
  const inventoryValue = Number(inventorySummary?.inventoryValue ?? 0);
  const lowStockItems = inventorySummary?.lowStockItems ?? [];
  const recentMovements = stockMovements.slice(0, 5);

  return (
    <section>
      <h1>Finance</h1>
      <p className="muted">Finance, commercial, distribution, stock value, and payment controls for hotel leadership.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Captured Payments</span>
          <strong>{formatCurrency(paymentVolume || 0)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Suppliers</span>
          <strong>{(data.suppliers ?? []).length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Stock Units</span>
          <strong>{stockUnits}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Low Stock Items</span>
          <strong>{lowStockItems.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Inventory Value</span>
          <strong>{formatCurrency(inventoryValue || 0)}</strong>
        </div>
      </div>
      <div className="catalog-grid">
        <ModuleSection
          title="Corporate Accounts"
          subtitle="B2B contracted business"
          records={data.corporate ?? []}
          renderMeta={(record) => `${record.contactName ?? 'No contact'} · ${record.contactEmail ?? 'No email'}`}
        />
        <ModuleSection
          title="Channel Integrations"
          subtitle="Connected OTAs and channel partners"
          records={data.integrations ?? []}
          renderMeta={(record) => `${record.channelName} · ${record.isActive ? 'Active' : 'Inactive'}`}
        />
        <ModuleSection
          title="Channel Sync Logs"
          subtitle="Distribution health checks"
          records={data.logs ?? []}
          renderMeta={(record) => `${record.type} · ${record.status}`}
        />
        <ModuleSection
          title="Payment Transactions"
          subtitle="Gateway-level transaction records"
          records={data.payments ?? []}
          renderMeta={(record) => `${record.provider} · ${formatCurrency(record.amount, record.currency)} · ${record.status}`}
        />
        <ModuleSection
          title="Suppliers"
          subtitle="Approved procurement partners"
          records={data.suppliers ?? []}
          renderMeta={(record) => record.contactEmail ?? 'No contact email'}
        />
        <ModuleSection
          title="Stock Inventory"
          subtitle="Current stock position with valuation and reorder control"
          records={data.stock ?? []}
          renderMeta={(record) =>
            `${record.quantity} ${record.unit} · ${formatCurrency(record.unitCost || 0)} per unit${Number(record.reorderLevel || 0) > 0 ? ` · Reorder at ${record.reorderLevel}` : ''}${lowStockItems.some((item: any) => item.id === record.id) ? ' · Low stock' : ''}`
          }
        />
      </div>
      <div className="hero-grid">
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Low Stock Watchlist</h3>
              <p className="muted">Items at or below reorder level for finance and procurement review.</p>
            </div>
          </div>
          <div className="stack-list compact-list">
            {lowStockItems.length ? lowStockItems.map((item: any) => (
              <div className="list-row" key={item.id}>
                <span>{item.name}</span>
                <strong>{item.quantity} {item.unit}</strong>
              </div>
            )) : <p className="muted">No low stock alerts right now.</p>}
          </div>
        </div>
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Recent Stock Movements</h3>
              <p className="muted">Latest purchases, issues, and adjustments that affect inventory value.</p>
            </div>
          </div>
          <div className="stack-list compact-list">
            {recentMovements.length ? recentMovements.map((movement: any) => (
              <div className="list-row" key={movement.id}>
                <span>{movement.stockItem?.name ?? 'Stock Item'} · {movement.type}</span>
                <strong>{movement.quantity} units</strong>
              </div>
            )) : <p className="muted">No stock movements have been posted yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountingPage({ token }: { token: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setError('');
        setEntries(await getLedgerEntries(token));
      } catch (err: any) {
        setError(err.message ?? 'Failed to load accounting ledger');
      }
    }

    void load();
  }, [token]);

  const charges = entries.filter((entry) => entry.type === 'CHARGE');
  const payments = entries.filter((entry) => entry.type === 'PAYMENT');
  const chargeTotal = charges.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const paymentTotal = payments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return (
    <section>
      <h1>Accounting</h1>
      <p className="muted">Ledger feed for finance and accounts teams. Posted charges and payments land here.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Ledger Charges</span>
          <strong>{formatCurrency(chargeTotal || 0)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ledger Payments</span>
          <strong>{formatCurrency(paymentTotal || 0)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Net Position</span>
          <strong>{formatCurrency((chargeTotal - paymentTotal) || 0)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Entries Posted</span>
          <strong>{entries.length}</strong>
        </div>
      </div>
      <div className="card">
        <div className="section-head">
          <div>
            <h3>Ledger Entries</h3>
            <p className="muted">Operational and billing postings routed into finance.</p>
          </div>
          <span className="pill">{entries.length}</span>
        </div>
        <div className="stack-list">
          {entries.map((entry) => (
            <div key={entry.id} className="list-row">
              <div>
                <strong>{entry.type}</strong>
                <div className="muted">
                  {entry.reference || 'System entry'}
                  {entry.folio?.id ? ` · Folio ${entry.folio.id.slice(0, 8)}` : ''}
                </div>
                <div className="muted">{formatDateTime(entry.createdAt)}</div>
              </div>
              <div className="price-chip">{formatCurrency(entry.amount, entry.currency)}</div>
            </div>
          ))}
          {entries.length === 0 ? <p className="muted">No ledger entries yet.</p> : null}
        </div>
      </div>
    </section>
  );
}

function MenuCatalogPage({
  title,
  subtitle,
  token,
  role,
  loadItems,
  loadCategories,
  loadOrders,
  createOrder,
  getOrder,
  postOrder,
  updateOrder,
  cancelOrder,
}: {
  title: string;
  subtitle: string;
  token: string;
  role: UserRole;
  loadItems: (token: string) => Promise<any[]>;
  loadCategories: (token: string) => Promise<any[]>;
  loadOrders: (token: string) => Promise<any[]>;
  createOrder: (
    token: string,
    body: {
      folioId?: string;
      taxRate?: number;
      postToFolio?: boolean;
      currency?: string;
      items: Array<{ itemId: string; quantity: number; notes?: string }>;
    },
  ) => Promise<any>;
  getOrder: (token: string, orderId: string) => Promise<any>;
  postOrder: (token: string, orderId: string, folioId: string) => Promise<any>;
  updateOrder: (
    token: string,
    orderId: string,
    body: {
      folioId?: string;
      taxRate?: number;
      postToFolio?: boolean;
      currency?: string;
      items: Array<{ itemId: string; quantity: number; notes?: string }>;
    },
  ) => Promise<any>;
  cancelOrder: (token: string, orderId: string, reverseFolioCharge?: boolean, reason?: string) => Promise<any>;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [editingOrderId, setEditingOrderId] = useState('');
  const [editingAudit, setEditingAudit] = useState<any[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function refresh() {
    try {
      setError('');
      const [itemList, categoryList, orderList, reservationList] = await Promise.all([
        loadItems(token),
        loadCategories(token),
        loadOrders(token),
        getReservations(token),
      ]);
      setItems(itemList);
      setCategories(categoryList);
      setOrders(orderList);
      setReservations(reservationList);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load menu');
    }
  }

  useEffect(() => {
    void refresh();
  }, [loadCategories, loadItems, loadOrders, token]);

  const grouped = categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.category?.id === category.id),
  }));

  function toggleItem(itemId: string) {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: prev[itemId] ? prev[itemId] + 1 : 1,
    }));
  }

  function setQuantity(itemId: string, quantity: number) {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = quantity;
      }
      return next;
    });
  }

  async function submitOrder(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setStatus('');
      const chosenItems = Object.entries(selectedItems)
        .filter(([, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => ({ itemId, quantity }));

      if (chosenItems.length === 0) {
        throw new Error('Choose at least one item for the order.');
      }

      let folioId: string | undefined;
      if (selectedReservationId) {
        const folio = await getFolioByReservation(token, selectedReservationId);
        folioId = folio.id;
      }

      const payload = {
        folioId,
        postToFolio: Boolean(folioId),
        items: chosenItems,
      };

      if (editingOrderId) {
        await updateOrder(token, editingOrderId, payload);
      } else {
        await createOrder(token, payload);
      }
      setSelectedItems({});
      setSelectedReservationId('');
      setEditingOrderId('');
      setEditingAudit([]);
      setCancelReason('');
      setStatus(editingOrderId ? 'Order updated.' : 'Order created.');
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create order');
    }
  }

  async function postOpenOrder(orderId: string, reservationId: string) {
    try {
      setError('');
      const folio = await getFolioByReservation(token, reservationId);
      await postOrder(token, orderId, folio.id);
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to post order to folio');
    }
  }

  async function cancelExistingOrder(orderId: string) {
    try {
      setError('');
      const order = orders.find((entry) => entry.id === orderId);
      await cancelOrder(
        token,
        orderId,
        order?.status === 'POSTED',
        cancelReason || 'Guest changed the order',
      );
      setCancelReason('');
      await refresh();
    } catch (err: any) {
      setError(err.message ?? 'Failed to cancel order');
    }
  }

  async function editExistingOrder(orderId: string) {
    try {
      setError('');
      const detail = await getOrder(token, orderId);
      const nextItems: Record<string, number> = {};
      for (const item of detail.items ?? []) {
        if (item.item?.id) {
          nextItems[item.item.id] = Number(item.quantity || 0);
        }
      }
      setSelectedItems(nextItems);
      setSelectedReservationId('');
      setEditingOrderId(orderId);
      setEditingAudit(detail.events ?? []);
      setStatus('Order loaded for editing.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load order for editing');
    }
  }

  function resetOrderForm() {
    setSelectedItems({});
    setSelectedReservationId('');
    setEditingOrderId('');
    setEditingAudit([]);
    setCancelReason('');
    setStatus('');
  }

  return (
    <section>
      <h1>{title}</h1>
      <p className="muted">{subtitle}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="hero-grid">
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Order Taking</h3>
              <p className="muted">Build orders, amend open orders, and post them to an open folio.</p>
            </div>
            <div className="row">
              {editingOrderId ? <span className="pill warning">Editing order</span> : null}
              <button className="ghost" type="button" onClick={refresh}>Refresh</button>
              {editingOrderId ? <button className="ghost" type="button" onClick={resetOrderForm}>Clear</button> : null}
            </div>
          </div>
          <form className="staff-form" onSubmit={submitOrder}>
            <select value={selectedReservationId} onChange={(e) => setSelectedReservationId(e.target.value)}>
              <option value="">Open tab without folio</option>
              {reservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.guestName} · Room {reservation.room?.roomNumber} · {reservation.status}
                </option>
              ))}
            </select>
            <div className="menu-picker">
              {items.map((item) => (
                <button key={item.id} type="button" className="ghost menu-pill" onClick={() => toggleItem(item.id)}>
                  {item.name}
                </button>
              ))}
            </div>
            <div className="stack-list selected-order">
              {Object.entries(selectedItems).map(([itemId, quantity]) => {
                const item = items.find((entry) => entry.id === itemId);
                if (!item) return null;
                return (
                  <div key={itemId} className="list-row">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="muted">{formatCurrency(item.price, item.currency)}</div>
                    </div>
                    <div className="row">
                      <button type="button" className="ghost" onClick={() => setQuantity(itemId, quantity - 1)}>-</button>
                      <strong>{quantity}</strong>
                      <button type="button" className="ghost" onClick={() => setQuantity(itemId, quantity + 1)}>+</button>
                    </div>
                  </div>
                );
              })}
              {Object.keys(selectedItems).length === 0 ? <p className="muted">No items selected.</p> : null}
            </div>
            <input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cancellation or amendment reason"
            />
            {editingAudit.length ? (
              <div className="mini-card">
                <strong>Order audit</strong>
                <div className="stack-list compact-list">
                  {editingAudit.map((event) => (
                    <div key={event.id} className="list-row align-start">
                      <div>
                        <strong>{event.eventType}</strong>
                        <div className="muted">{event.notes || 'No details recorded'}</div>
                      </div>
                      <span className="muted">{formatDateTime(event.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <button type="submit">{editingOrderId ? 'Save Changes' : 'Create Order'}</button>
          </form>
          {status ? <p>{status}</p> : null}
        </div>
        <div className="card">
          <div className="section-head">
            <div>
              <h3>Open Orders</h3>
            <p className="muted">Service orders created for this hotel.</p>
            </div>
            <span className="pill">{orders.length}</span>
          </div>
          <div className="stack-list">
            {orders.map((order) => (
              <div key={order.id} className="list-row">
                <div>
                  <strong>{formatCurrency(order.total, order.currency)}</strong>
                  <div className="muted">
                    {order.items?.length ?? 0} items · {order.folio ? 'Posted to folio' : 'Open tab'}
                  </div>
                </div>
                <div className="row">
                  <span className={`pill ${toneForStatus(order.status)}`}>{order.status}</span>
                  {!order.folio && selectedReservationId ? (
                    <button className="ghost" onClick={() => postOpenOrder(order.id, selectedReservationId)}>
                      Post
                    </button>
                  ) : null}
                  {order.status === 'OPEN' ? (
                    <button className="ghost" onClick={() => void editExistingOrder(order.id)}>
                      Edit
                    </button>
                  ) : null}
                  {role === 'ADMIN' || order.status === 'OPEN' ? (
                    <button className="ghost" onClick={() => cancelExistingOrder(order.id)}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {orders.length === 0 ? <p className="muted">No orders yet.</p> : null}
          </div>
        </div>
      </div>
      <div className="catalog-grid">
        {grouped.map((category) => (
          <div key={category.id} className="card">
            <div className="section-head">
              <div>
                <h3>{category.name}</h3>
                {category.description ? <p className="muted">{category.description}</p> : null}
              </div>
              <span className="pill">{category.items.length} items</span>
            </div>
            <div className="stack-list">
              {category.items.map((item: any) => (
                <div key={item.id} className="list-row">
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">
                      Code {item.sku || 'N/A'} · Tax {(Number(item.taxRate) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="price-chip">{formatCurrency(item.price, item.currency)}</div>
                </div>
              ))}
              {category.items.length === 0 ? <p className="muted">No items in this category yet.</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FrontdeskPage({ token }: { token: string }) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);

  async function refresh(selectedId?: string) {
    try {
      setError('');
      const items = await getReservations(token);
      setReservations(items);
      setSelectedReservation((current) => {
        const targetId = selectedId ?? current?.id;
        if (!targetId) return current;
        return items.find((item) => item.id === targetId) ?? null;
      });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function checkInReservation(id: string) {
    await checkIn(token, id);
    await refresh(id);
  }

  async function checkOutReservation(id: string) {
    await checkOut(token, id);
    await refresh(id);
  }

  async function confirmReservation(id: string) {
    await updateReservationStatus(token, id, 'CONFIRMED');
    await refresh(id);
  }

  useEffect(() => {
    void refresh();
  }, [token]);

  const pending = reservations.filter((item) => item.status === 'PENDING').length;
  const confirmed = reservations.filter((item) => item.status === 'CONFIRMED').length;
  const checkedIn = reservations.filter((item) => item.status === 'CHECKED_IN').length;
  const checkedOut = reservations.filter((item) => item.status === 'CHECKED_OUT').length;

  return (
    <section>
      <div className="row">
        <h1>Front Desk</h1>
        <button onClick={refresh}>Refresh</button>
      </div>
      <p className="muted">Arrival, in-house, and departure control for reception teams.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="stats-grid compact">
        <div className="stat-card stat-card-warning">
          <span className="stat-label">Pending</span>
          <strong>{pending}</strong>
        </div>
        <div className="stat-card stat-card-accent">
          <span className="stat-label">Confirmed Arrivals</span>
          <strong>{confirmed}</strong>
        </div>
        <div className="stat-card stat-card-success">
          <span className="stat-label">Checked In</span>
          <strong>{checkedIn}</strong>
        </div>
        <div className="stat-card stat-card-indigo">
          <span className="stat-label">Checked Out</span>
          <strong>{checkedOut}</strong>
        </div>
      </div>
      <div className="hero-grid">
        <div className="card frontdesk-card">
          <div className="section-head">
            <div>
              <h3>Stay Queue</h3>
              <p className="muted">Select a stay, review guest details, then complete check-in or check-out from the proper front-office flow.</p>
            </div>
            <span className="pill">{reservations.length} stays</span>
          </div>
          <div className="frontdesk-list">
            {reservations.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`frontdesk-row ${selectedReservation?.id === r.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedReservation(r)}
              >
                <div className="frontdesk-row-main">
                  <strong>{r.guestName}</strong>
                  <div className="muted">
                    Room {r.room?.roomNumber ?? '-'} · {formatUtcDate(r.checkInDate)} to {formatUtcDate(r.checkOutDate)}
                  </div>
                </div>
                <div className="pill-group">
                  <span className="pill">{r.room?.roomType ?? 'Stay'}</span>
                  <span className={`pill ${toneForStatus(r.status)}`}>{r.status}</span>
                </div>
              </button>
            ))}
            {reservations.length === 0 ? <p className="muted">No reservations available right now.</p> : null}
          </div>
        </div>
        <div className="card frontdesk-card">
          <h3>Reservation Details</h3>
          {selectedReservation ? (
            <div className="stack-list compact-list">
              <div className="list-row">
                <span className="muted">Guest</span>
                <strong>{selectedReservation.guestName}</strong>
              </div>
              <div className="list-row">
                <span className="muted">Email</span>
                <strong>{selectedReservation.guestEmail || 'Not captured'}</strong>
              </div>
              <div className="list-row">
                <span className="muted">Room</span>
                <strong>{selectedReservation.room?.roomNumber || '-'}</strong>
              </div>
              <div className="list-row">
                <span className="muted">Stay</span>
                <strong>{formatUtcDate(selectedReservation.checkInDate)} to {formatUtcDate(selectedReservation.checkOutDate)}</strong>
              </div>
              <div className="list-row">
                <span className="muted">Status</span>
                <strong><span className={`pill ${toneForStatus(selectedReservation.status)}`}>{selectedReservation.status}</span></strong>
              </div>
              <div className="row">
                <button
                  className="ghost"
                  onClick={() => void confirmReservation(selectedReservation.id)}
                  disabled={selectedReservation.status !== 'PENDING'}
                >
                  Confirm Stay
                </button>
                <button
                  onClick={() => void checkInReservation(selectedReservation.id)}
                  disabled={selectedReservation.status !== 'CONFIRMED'}
                >
                  Check In
                </button>
                <button
                  className="ghost"
                  onClick={() => void checkOutReservation(selectedReservation.id)}
                  disabled={selectedReservation.status !== 'CHECKED_IN'}
                >
                  Check Out
                </button>
              </div>
              <p className="muted frontdesk-note">
                Rooms become occupied only through a valid guest check-in, and return to available on checkout.
              </p>
              {selectedReservation.guest?.id ? (
                <Link className="ghost-link" to={`/guests/${selectedReservation.guest.id}`}>
                  Open Guest Profile
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="muted">Select a reservation to review front-desk details.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function BillingPage({ token }: { token: string }) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationId, setReservationId] = useState('');
  const [folio, setFolio] = useState<any | null>(null);
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState('CARD');
  const [reference, setReference] = useState('');
  const [summary, setSummary] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReservations() {
      try {
        setError('');
        const items = await getReservations(token);
        setReservations(items);

        if (!reservationId && items.length > 0) {
          const preferred =
            items.find((item) => item.status === 'CHECKED_OUT') ??
            items.find((item) => item.status === 'CHECKED_IN') ??
            items[0];
          setReservationId(preferred.id);
        }
      } catch (err: any) {
        setError(err.message ?? 'Failed to load reservations');
      }
    }

    void loadReservations();
  }, [token]);

  async function loadFolio() {
    try {
      setError('');
      const f = await getFolioByReservation(token, reservationId);
      setFolio(f);
      setSummary(await getSummary(token, f.id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function pay() {
    if (!folio) return;
    await postPayment(token, folio.id, Number(amount), method, reference || undefined);
    setSummary(await getSummary(token, folio.id));
  }

  async function invoice() {
    if (!folio) return;
    await generateInvoice(token, folio.id, 0.12);
    setSummary(await getSummary(token, folio.id));
  }

  return (
    <section>
      <h1>Billing</h1>
      <div className="card">
        <label>Reservation</label>
        <select value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
          <option value="">Select reservation</option>
          {reservations.map((reservation) => (
            <option key={reservation.id} value={reservation.id}>
              {reservation.guestName} · Room {reservation.room?.roomNumber} · {reservation.status}
            </option>
          ))}
        </select>
        <label>Reservation ID</label>
        <input value={reservationId} onChange={(e) => setReservationId(e.target.value)} />
        <button onClick={loadFolio}>Load Folio</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {folio ? (
        <div className="card">
          <div className="section-head">
            <div>
              <p>Folio: {folio.id}</p>
              <p>Status: {folio.status}</p>
            </div>
            {summary ? <div className="price-chip">Balance {formatCurrency(summary.balanceDue, summary.currency)}</div> : null}
          </div>
          <div className="row">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>CARD</option>
              <option>CASH</option>
              <option>UPI</option>
              <option>BANK_TRANSFER</option>
            </select>
            <input
              placeholder="Idempotency/Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <button onClick={pay}>Post Payment</button>
            <button onClick={invoice}>Generate Invoice</button>
          </div>
          {summary ? (
            <>
              <div className="stats-grid compact">
                <div className="stat-card">
                  <span className="stat-label">Subtotal</span>
                  <strong>{formatCurrency(summary.subtotal, summary.currency)}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Tax</span>
                  <strong>{formatCurrency(summary.tax, summary.currency)}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Payments</span>
                  <strong>{formatCurrency(summary.payments, summary.currency)}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total</span>
                  <strong>{formatCurrency(summary.total, summary.currency)}</strong>
                </div>
              </div>
              <pre>{JSON.stringify(summary, null, 2)}</pre>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ReportsPage({ token }: { token: string }) {
  const defaultRange = getDefaultReportRange();
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [kpis, setKpis] = useState<any | null>(null);
  const [dailyKpis, setDailyKpis] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [summary, daily] = await Promise.all([
        getKpis(token, from, to),
        getDailyKpis(token, from, to),
      ]);
      setKpis(summary);
      setDailyKpis(daily);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const occupancyPercent = kpis ? `${Math.round(Number(kpis.occupancyRate || 0) * 100)}%` : '0%';
  const paymentsCollected = kpis ? Math.abs(Number(kpis.revenue?.payments || 0)) : 0;

  return (
    <section>
      <h1>Finance Reports</h1>
      <p className="muted">Readable revenue, occupancy, and daily review for finance and hotel leadership.</p>
      <div className="row">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={load}>Load Report</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {kpis ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Occupancy</span>
              <strong>{occupancyPercent}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">ADR (Average Daily Rate)</span>
              <strong>{formatCurrency(kpis.adr)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">RevPAR (Revenue Per Available Room)</span>
              <strong>{formatCurrency(kpis.revPar)}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Room Nights Sold</span>
              <strong>{kpis.occupiedNights}</strong>
            </div>
          </div>
          <div className="hero-grid">
            <div className="card">
              <div className="section-head">
                <div>
                  <h3>Revenue Summary</h3>
                  <p className="muted">{kpis.from} to {kpis.to}</p>
                </div>
              </div>
              <div className="stack-list compact-list">
                <div className="list-row">
                  <span className="muted">Room Revenue</span>
                  <strong>{formatCurrency(kpis.revenue.roomRevenue)}</strong>
                </div>
                <div className="list-row">
                  <span className="muted">Net Revenue</span>
                  <strong>{formatCurrency(kpis.revenue.netRevenue)}</strong>
                </div>
                <div className="list-row">
                  <span className="muted">Tax</span>
                  <strong>{formatCurrency(kpis.revenue.tax)}</strong>
                </div>
                <div className="list-row">
                  <span className="muted">Gross Revenue</span>
                  <strong>{formatCurrency(kpis.revenue.grossRevenue)}</strong>
                </div>
                <div className="list-row">
                  <span className="muted">Payments Collected</span>
                  <strong>{formatCurrency(paymentsCollected)}</strong>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-head">
                <div>
                  <h3>Performance Mix</h3>
                  <p className="muted">High-level KPI contribution for the selected period.</p>
                </div>
              </div>
              <div className="chart-list">
                <div className="chart-row">
                  <div className="list-row dense">
                    <span>Occupancy</span>
                    <strong>{occupancyPercent}</strong>
                  </div>
                  <div className="chart-track">
                    <div className="chart-bar success" style={{ width: `${Math.max(Number(kpis.occupancyRate || 0) * 100, 4)}%` }} />
                  </div>
                </div>
                <div className="chart-row">
                  <div className="list-row dense">
                    <span>Gross Revenue vs Available Nights</span>
                    <strong>{formatCurrency(kpis.revenue.grossRevenue)}</strong>
                  </div>
                  <div className="chart-track">
                    <div className="chart-bar" style={{ width: `${Math.min((Number(kpis.occupiedNights || 0) / Math.max(Number(kpis.availableRoomNights || 1), 1)) * 100 * 2, 100)}%` }} />
                  </div>
                </div>
                <div className="chart-row">
                  <div className="list-row dense">
                    <span>Payments Recovery</span>
                    <strong>{formatCurrency(paymentsCollected)}</strong>
                  </div>
                  <div className="chart-track">
                    <div className="chart-bar warning" style={{ width: `${Math.min((paymentsCollected / Math.max(Number(kpis.revenue.grossRevenue || 1), 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="section-head">
              <div>
                <h3>Daily Finance Review</h3>
                <p className="muted">Day-by-day occupancy review for finance and management closing.</p>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Occupied Rooms</th>
                  <th>Available Rooms</th>
                  <th>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {dailyKpis.map((day) => (
                  <tr key={day.date}>
                    <td>{formatUtcDate(day.date)}</td>
                    <td>{day.occupiedNights}</td>
                    <td>{day.availableRoomNights}</td>
                    <td>{Math.round(Number(day.occupancyRate || 0) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ImportsPage({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Choose a CSV file exported from Excel first.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(await importRestaurantItems(token, file, defaultCurrency));
    } catch (err: any) {
      setError(err.message ?? 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Data Import</h1>
      <div className="card">
        <p className="muted">
          Upload a CSV exported from Excel. Expected columns include
          {' '}
          <code>category</code>
          ,
          {' '}
          <code>item_code</code>
          ,
          {' '}
          <code>item_name</code>
          ,
          {' '}
          <code>price</code>
          ,
          {' '}
          <code>tax_rate</code>
          ,
          {' '}
          <code>currency</code>
          .
        </p>
        <form className="import-form" onSubmit={submit}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <input
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
            placeholder="Default currency"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Importing...' : 'Import CSV'}
          </button>
        </form>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <div className="card">
          <p>Total rows: {result.totalRows}</p>
          <p>Created: {result.created}</p>
          <p>Updated: {result.updated}</p>
          <p>Skipped: {result.skipped}</p>
          {result.errors?.length ? (
            <>
              <h3>Errors</h3>
              <pre>{JSON.stringify(result.errors, null, 2)}</pre>
            </>
          ) : null}
          <h3>Processed</h3>
          <pre>{JSON.stringify(result.processed, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

export function App() {
  const { session, save } = useSessionStorage();

  function updateTenantSession(data: { softwareName?: string; enabledModules?: string[] }) {
    if (!session) return;
    save({
      ...session,
      user: {
        ...session.user,
        softwareName: data.softwareName ?? session.user.softwareName,
        enabledModules: data.enabledModules ?? session.user.enabledModules,
      },
    });
  }

  const app = useMemo(() => {
    if (!session) return null;
    return (
      <Layout session={session} onLogout={() => save(null)}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={hasModule(session.user, 'dashboard') ? <DashboardPage token={session.token} /> : <Navigate to="/frontdesk" replace />} />
          <Route
            path="/property"
            element={
              hasModule(session.user, 'property') && canAccessFinance(session.user) ? (
                <PropertyPage token={session.token} onTenantUpdated={updateTenantSession} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/users"
            element={
              hasModule(session.user, 'users') && session.user.role === 'ADMIN' ? (
                <UsersPage token={session.token} tenantCode={session.user.tenantCode} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/frontdesk"
            element={canAccessFrontOffice(session.user) ? <FrontdeskPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/reservations"
            element={hasModule(session.user, 'reservations') && canAccessFrontOffice(session.user) ? <ReservationsPage token={session.token} role={session.user.role} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/rooms"
            element={hasModule(session.user, 'rooms') && (canAccessFrontOffice(session.user) || canAccessHousekeeping(session.user) || canAccessMaintenance(session.user)) ? <RoomsPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/room-board"
            element={hasModule(session.user, 'rooms') && (canAccessFrontOffice(session.user) || canAccessHousekeeping(session.user) || canAccessMaintenance(session.user)) ? <RoomBoardPage token={session.token} role={session.user.role} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/guests"
            element={hasModule(session.user, 'guests') && canAccessFrontOffice(session.user) ? <GuestsPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/guests/:guestId"
            element={hasModule(session.user, 'guests') && canAccessFrontOffice(session.user) ? <GuestDetailPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/restaurant"
            element={
              hasModule(session.user, 'restaurant') && canAccessRestaurant(session.user) ? (
                <MenuCatalogPage
                  title="Restaurant Menu"
                  subtitle="Imported and seeded F&B items for room service and dining."
                  token={session.token}
                  role={session.user.role}
                  loadItems={getRestaurantItems}
                  loadCategories={getRestaurantCategories}
                  loadOrders={getRestaurantOrders}
                  createOrder={createRestaurantOrder}
                  getOrder={getRestaurantOrder}
                  postOrder={postRestaurantOrder}
                  updateOrder={updateRestaurantOrder}
                  cancelOrder={cancelRestaurantOrder}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/bar"
            element={
              hasModule(session.user, 'bar') && canAccessBar(session.user) ? (
                <MenuCatalogPage
                  title="Bar Menu"
                  subtitle="Cocktails, pours, and bar bites available in the hotel property."
                  token={session.token}
                  role={session.user.role}
                  loadItems={getBarItems}
                  loadCategories={getBarCategories}
                  loadOrders={getBarOrders}
                  createOrder={createBarOrder}
                  getOrder={getBarOrder}
                  postOrder={postBarOrder}
                  updateOrder={updateBarOrder}
                  cancelOrder={cancelBarOrder}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/housekeeping"
            element={canAccessHousekeeping(session.user) ? <HousekeepingPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/maintenance"
            element={canAccessMaintenance(session.user) ? <MaintenancePage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/operations"
            element={hasModule(session.user, 'operations') && session.user.role === 'ADMIN' ? <OperationsPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/commerce"
            element={hasModule(session.user, 'finance') && canAccessFinance(session.user) ? <CommercePage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/accounting"
            element={hasModule(session.user, 'accounting') && canAccessFinance(session.user) ? <AccountingPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/billing"
            element={hasModule(session.user, 'billing') && canAccessFinance(session.user) ? <BillingPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/reports"
            element={hasModule(session.user, 'reports') && canAccessFinance(session.user) ? <ReportsPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/imports"
            element={hasModule(session.user, 'imports') && session.user.role === 'ADMIN' ? <ImportsPage token={session.token} /> : <Navigate to="/dashboard" replace />}
          />
        </Routes>
      </Layout>
    );
  }, [save, session]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={save} />} />
      <Route
        path="*"
        element={
          <AuthGate session={session}>
            {app ?? <Navigate to="/login" replace />}
          </AuthGate>
        }
      />
    </Routes>
  );
}
