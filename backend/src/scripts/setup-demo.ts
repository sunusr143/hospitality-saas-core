import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import dataSource from '../database/data-source';
import { Tenant } from '../modules/tenants/tenant.entity';
import { User } from '../modules/users/user.entity';
import { UserRole } from '../modules/users/enums/user-role.enum';
import { Room } from '../modules/rooms/room.entity';
import { RoomStatus } from '../modules/rooms/enums/room-status.enum';
import { Reservation, ReservationStatus } from '../modules/reservations/reservation.entity';
import { RatePlan } from '../modules/rate-plans/entities/rate-plan.entity';
import { RatePlanStatus } from '../modules/rate-plans/enums/rate-plan-status.enum';
import { Folio } from '../modules/billing/entities/folio.entity';
import { FolioStatus } from '../modules/billing/enums/folio-status.enum';
import { FolioLineItem } from '../modules/billing/entities/folio-line-item.entity';
import { FolioLineItemType } from '../modules/billing/enums/folio-line-item-type.enum';
import { BarCategory } from '../modules/bar/entities/bar-category.entity';
import { BarItem } from '../modules/bar/entities/bar-item.entity';
import { RestaurantCategory } from '../modules/restaurant/entities/restaurant-category.entity';
import { RestaurantItem } from '../modules/restaurant/entities/restaurant-item.entity';
import { Guest } from '../modules/guests/guest.entity';
import { HousekeepingTask } from '../modules/housekeeping/entities/housekeeping-task.entity';
import { HousekeepingStatus } from '../modules/housekeeping/enums/housekeeping-status.enum';
import { HousekeepingPriority } from '../modules/housekeeping/enums/housekeeping-priority.enum';
import { MaintenanceRequest } from '../modules/maintenance/entities/maintenance-request.entity';
import { MaintenanceStatus } from '../modules/maintenance/enums/maintenance-status.enum';
import { SpaService } from '../modules/spa/entities/spa-service.entity';
import { SpaAppointment } from '../modules/spa/entities/spa-appointment.entity';
import { SpaAppointmentStatus } from '../modules/spa/enums/spa-appointment-status.enum';
import { TransportRequest } from '../modules/concierge/entities/transport-request.entity';
import { LaundryOrder } from '../modules/laundry/entities/laundry-order.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Event } from '../modules/events/entities/event.entity';
import { Supplier } from '../modules/procurement/entities/supplier.entity';
import { StockItem } from '../modules/procurement/entities/stock-item.entity';
import { StockMovement, StockMovementType } from '../modules/procurement/entities/stock-movement.entity';
import { Shift } from '../modules/hr/entities/shift.entity';
import { CorporateAccount } from '../modules/corporate/entities/corporate-account.entity';
import { ChannelIntegration } from '../modules/channel/entities/channel-integration.entity';
import { ChannelSyncLog } from '../modules/channel/entities/channel-sync-log.entity';
import { ChannelSyncType } from '../modules/channel/enums/channel-sync-type.enum';
import { ChannelSyncStatus } from '../modules/channel/enums/channel-sync-status.enum';
import { PaymentTransaction } from '../modules/payments/entities/payment-transaction.entity';
import { PaymentStatus } from '../modules/payments/enums/payment-status.enum';

const DEMO_TENANT_CODE = 'SUNU_DEMO';
const DEMO_TENANT_NAME = 'Sunu Demo Hotel';
const DEMO_SOFTWARE_NAME = 'Hospitality';
const DEMO_ADMIN_EMAIL = 'admin@sunu.com';
const DEMO_ADMIN_PASSWORD = 'admin123';
const DEMO_STAFF_EMAIL = 'staff@sunu.com';
const DEMO_STAFF_PASSWORD = 'staff1234';
const CURRENCY = 'INR';
const ROOM_RATE = 275;

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function main() {
  if ((process.env.APP_MODE ?? 'demo') !== 'demo') {
    console.log('APP_MODE is not demo. Skipping demo seed.');
    return;
  }

  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);
  const roomRepo = dataSource.getRepository(Room);
  const reservationRepo = dataSource.getRepository(Reservation);
  const ratePlanRepo = dataSource.getRepository(RatePlan);
  const folioRepo = dataSource.getRepository(Folio);
  const lineItemRepo = dataSource.getRepository(FolioLineItem);
  const barCategoryRepo = dataSource.getRepository(BarCategory);
  const barItemRepo = dataSource.getRepository(BarItem);
  const restaurantCategoryRepo = dataSource.getRepository(RestaurantCategory);
  const restaurantItemRepo = dataSource.getRepository(RestaurantItem);
  const guestRepo = dataSource.getRepository(Guest);
  const housekeepingRepo = dataSource.getRepository(HousekeepingTask);
  const maintenanceRepo = dataSource.getRepository(MaintenanceRequest);
  const spaServiceRepo = dataSource.getRepository(SpaService);
  const spaAppointmentRepo = dataSource.getRepository(SpaAppointment);
  const conciergeRepo = dataSource.getRepository(TransportRequest);
  const laundryRepo = dataSource.getRepository(LaundryOrder);
  const notificationsRepo = dataSource.getRepository(Notification);
  const eventsRepo = dataSource.getRepository(Event);
  const supplierRepo = dataSource.getRepository(Supplier);
  const stockRepo = dataSource.getRepository(StockItem);
  const stockMovementRepo = dataSource.getRepository(StockMovement);
  const shiftRepo = dataSource.getRepository(Shift);
  const corporateRepo = dataSource.getRepository(CorporateAccount);
  const channelIntegrationRepo = dataSource.getRepository(ChannelIntegration);
  const channelLogRepo = dataSource.getRepository(ChannelSyncLog);
  const paymentTransactionRepo = dataSource.getRepository(PaymentTransaction);

  const now = new Date();
  const pastCheckIn = addDays(now, -4);
  const pastCheckOut = addDays(now, -2);
  const currentCheckIn = addDays(now, -1);
  const currentCheckOut = addDays(now, 1);
  const upcomingCheckIn = addDays(now, 1);
  const upcomingCheckOut = addDays(now, 3);

  let tenant = await tenantRepo.findOne({
    where: { code: DEMO_TENANT_CODE },
  });

  if (!tenant) {
    tenant = await tenantRepo.save(
      tenantRepo.create({
        code: DEMO_TENANT_CODE,
        name: DEMO_TENANT_NAME,
        softwareName: DEMO_SOFTWARE_NAME,
        contactEmail: 'reservations@sunudemo.example',
        contactPhone: '+91-8040001200',
        addressLine1: 'Residency Road, Bengaluru',
        city: 'Bengaluru',
        country: 'India',
        currencyCode: 'INR',
        timezone: 'Asia/Kolkata',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        enabledModules: [...Tenant.DEFAULT_ENABLED_MODULES],
        isActive: true,
      }),
    );
  } else if (
    tenant.name !== DEMO_TENANT_NAME ||
    tenant.softwareName !== DEMO_SOFTWARE_NAME ||
    !tenant.isActive
  ) {
    tenant.name = DEMO_TENANT_NAME;
    tenant.softwareName = DEMO_SOFTWARE_NAME;
    tenant.contactEmail = 'reservations@sunudemo.example';
    tenant.contactPhone = '+91-8040001200';
    tenant.addressLine1 = 'Residency Road, Bengaluru';
    tenant.city = 'Bengaluru';
    tenant.country = 'India';
    tenant.currencyCode = 'INR';
    tenant.timezone = 'Asia/Kolkata';
    tenant.checkInTime = '14:00';
    tenant.checkOutTime = '11:00';
    tenant.enabledModules = tenant.enabledModules?.length
      ? tenant.enabledModules
      : [...Tenant.DEFAULT_ENABLED_MODULES];
    tenant.isActive = true;
    tenant = await tenantRepo.save(tenant);
  }

  const adminHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);
  const staffHash = await bcrypt.hash(DEMO_STAFF_PASSWORD, 12);

  const admin = await upsertUser(userRepo, {
    email: DEMO_ADMIN_EMAIL,
    fullName: 'Demo Admin',
    password: adminHash,
    phone: '+91-9000000000',
    title: 'General Manager',
    department: 'Administration',
    addressLine1: 'Residency Road, Bengaluru',
    photoUrl: null,
    notes: 'Primary demo administrator for stakeholder walkthroughs.',
    role: UserRole.ADMIN,
    tenant,
  });

  await upsertUser(userRepo, {
    email: DEMO_STAFF_EMAIL,
    fullName: 'Demo Staff',
    password: staffHash,
    phone: '+91-9000000002',
    title: 'Front Office Executive',
    department: 'Front Office',
    addressLine1: 'MG Road, Bengaluru',
    photoUrl: null,
    notes: 'Operational staff account for frontdesk and service modules.',
    role: UserRole.STAFF,
    tenant,
  });

  const seededRooms = await Promise.all([
    upsertRoom(roomRepo, tenant, { roomNumber: '101', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '102', roomType: 'DELUXE', capacity: 2, status: RoomStatus.OCCUPIED }),
    upsertRoom(roomRepo, tenant, { roomNumber: '103', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '104', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '105', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '106', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '107', roomType: 'DELUXE', capacity: 2, status: RoomStatus.MAINTENANCE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '108', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '109', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '110', roomType: 'DELUXE', capacity: 2, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '201', roomType: 'SUITE', capacity: 3, status: RoomStatus.AVAILABLE }),
    upsertRoom(roomRepo, tenant, { roomNumber: '202', roomType: 'SUITE', capacity: 3, status: RoomStatus.AVAILABLE }),
  ]);
  const [room101, room102, room103] = [seededRooms[0], seededRooms[1], seededRooms[10]];

  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));

  let ratePlan = await ratePlanRepo.findOne({
    where: {
      tenant: { id: tenant.id },
      code: 'BAR',
    },
    relations: ['tenant'],
  });

  if (!ratePlan) {
    ratePlan = ratePlanRepo.create({
      tenant,
      code: 'BAR',
      name: 'Best Available Rate',
      description: 'Demo rate plan for local UI testing',
      basePrice: ROOM_RATE,
      validFrom: yearStart,
      validTo: yearEnd,
      status: RatePlanStatus.ACTIVE,
    });
  } else {
    ratePlan.name = 'Best Available Rate';
    ratePlan.description = 'Demo rate plan for local UI testing';
    ratePlan.basePrice = ROOM_RATE;
    ratePlan.validFrom = yearStart;
    ratePlan.validTo = yearEnd;
    ratePlan.status = RatePlanStatus.ACTIVE;
  }

  await ratePlanRepo.save(ratePlan);

  const confirmedReservation = await upsertReservation(
    reservationRepo,
    tenant,
    room101,
    admin,
    {
      guestName: 'Asha Patel',
      guestEmail: 'demo.confirmed@sunu.local',
      checkInDate: dateOnly(upcomingCheckIn),
      checkOutDate: dateOnly(upcomingCheckOut),
      status: ReservationStatus.CONFIRMED,
    },
  );

  const checkedInReservation = await upsertReservation(
    reservationRepo,
    tenant,
    room102,
    admin,
    {
      guestName: 'Rohan Mehta',
      guestEmail: 'demo.checkedin@sunu.local',
      checkInDate: dateOnly(currentCheckIn),
      checkOutDate: dateOnly(currentCheckOut),
      status: ReservationStatus.CHECKED_IN,
    },
  );

  const billingReservation = await upsertReservation(
    reservationRepo,
    tenant,
    room103,
    admin,
    {
      guestName: 'Neha Singh',
      guestEmail: 'demo.billing@sunu.local',
      checkInDate: dateOnly(pastCheckIn),
      checkOutDate: dateOnly(pastCheckOut),
      status: ReservationStatus.CHECKED_OUT,
    },
  );

  await upsertFolio(folioRepo, {
    tenant,
    reservation: confirmedReservation,
    room: room101,
    createdBy: admin,
    guestNameSnapshot: confirmedReservation.guestName,
    currency: CURRENCY,
    status: FolioStatus.OPEN,
    openedAt: now,
    closedAt: null,
  });

  await upsertFolio(folioRepo, {
    tenant,
    reservation: checkedInReservation,
    room: room102,
    createdBy: admin,
    guestNameSnapshot: checkedInReservation.guestName,
    currency: CURRENCY,
    status: FolioStatus.OPEN,
    openedAt: now,
    closedAt: null,
  });

  const billingFolio = await upsertFolio(folioRepo, {
    tenant,
    reservation: billingReservation,
    room: room103,
    createdBy: admin,
    guestNameSnapshot: billingReservation.guestName,
    currency: CURRENCY,
    status: FolioStatus.CLOSED,
    openedAt: pastCheckIn,
    closedAt: pastCheckOut,
  });

  await upsertLineItem(lineItemRepo, {
    tenant,
    folio: billingFolio,
    postedBy: admin,
    type: FolioLineItemType.ROOM_CHARGE,
    description: 'Room charge for demo stay',
    quantity: 2,
    unitPrice: ROOM_RATE,
    totalAmount: ROOM_RATE * 2,
    currency: CURRENCY,
    relatedEntityType: 'RESERVATION',
    relatedEntityId: billingReservation.id,
    paymentMethod: null,
    paymentReference: null,
  });

  await ensureBarMenu(barCategoryRepo, barItemRepo, tenant);
  await ensureRestaurantMenu(restaurantCategoryRepo, restaurantItemRepo, tenant);
  const primaryGuest = await upsertGuest(guestRepo, tenant, admin, {
    fullName: billingReservation.guestName,
    email: billingReservation.guestEmail,
    phone: '+91-9876543210',
    city: 'Bengaluru',
    country: 'India',
    vip: true,
    notes: 'VIP returning guest for demo modules',
  });
  await ensureOperationsData({
    tenant,
    admin,
    staff: await userRepo.findOneOrFail({ where: { email: DEMO_STAFF_EMAIL }, relations: ['tenant'] }),
    room101,
    room102,
    room103,
    guest: primaryGuest,
    housekeepingRepo,
    maintenanceRepo,
    spaServiceRepo,
    spaAppointmentRepo,
    conciergeRepo,
    laundryRepo,
    notificationsRepo,
    eventsRepo,
    supplierRepo,
    stockRepo,
    stockMovementRepo,
    shiftRepo,
    corporateRepo,
    channelIntegrationRepo,
    channelLogRepo,
    paymentTransactionRepo,
    billingFolio,
  });

  console.log('Demo environment is ready.');
  console.log(`Tenant: ${tenant.code}`);
  console.log(`Admin login: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`Staff login: ${DEMO_STAFF_EMAIL} / ${DEMO_STAFF_PASSWORD}`);
  console.log(`Frontdesk check-in reservation: ${confirmedReservation.id}`);
  console.log(`Frontdesk checkout reservation: ${checkedInReservation.id}`);
  console.log(`Billing/report reservation: ${billingReservation.id}`);
  console.log('Bar and restaurant menus seeded for demo UI.');
  console.log('Operations modules seeded: housekeeping, maintenance, spa, concierge, laundry, events, notifications, procurement, HR.');
  console.log('Commercial modules seeded: corporate, channel manager, payments.');

  await dataSource.destroy();
}

async function upsertUser(
  userRepo: Repository<User>,
  data: {
    email: string;
    fullName: string;
    password: string;
    phone: string | null;
    title: string | null;
    department: string | null;
    addressLine1: string | null;
    photoUrl: string | null;
    notes: string | null;
    role: UserRole;
    tenant: Tenant;
  },
) {
  let user = await userRepo.findOne({
    where: { email: data.email },
    relations: ['tenant'],
  });

  if (!user) {
    user = userRepo.create({
      ...data,
      isActive: true,
    });
  } else {
    user.fullName = data.fullName;
    user.password = data.password;
    user.phone = data.phone;
    user.title = data.title;
    user.department = data.department;
    user.addressLine1 = data.addressLine1;
    user.photoUrl = data.photoUrl;
    user.notes = data.notes;
    user.role = data.role;
    user.tenant = data.tenant;
    user.isActive = true;
  }

  return userRepo.save(user);
}

async function upsertRoom(
  roomRepo: Repository<Room>,
  tenant: Tenant,
  data: {
    roomNumber: string;
    roomType: string;
    capacity: number;
    status: RoomStatus;
  },
) {
  let room = await roomRepo.findOne({
    where: {
      tenant: { id: tenant.id },
      roomNumber: data.roomNumber,
    },
    relations: ['tenant'],
  });

  if (!room) {
    room = roomRepo.create({
      ...data,
      tenant,
    });
  } else {
    room.roomType = data.roomType;
    room.capacity = data.capacity;
    room.status = data.status;
    room.tenant = tenant;
  }

  return roomRepo.save(room);
}

async function upsertReservation(
  reservationRepo: Repository<Reservation>,
  tenant: Tenant,
  room: Room,
  createdBy: User,
  data: {
    guestName: string;
    guestEmail: string;
    checkInDate: string;
    checkOutDate: string;
    status: ReservationStatus;
  },
) {
  let reservation = await reservationRepo.findOne({
    where: {
      tenant: { id: tenant.id },
      guestEmail: data.guestEmail,
    },
    relations: ['tenant', 'room', 'createdBy'],
    order: {
      createdAt: 'DESC',
    },
  });

  if (!reservation) {
    reservation = reservationRepo.create({
      ...data,
      tenant,
      room,
      createdBy,
      guest: null,
    });
  } else {
    reservation.guestName = data.guestName;
    reservation.guestEmail = data.guestEmail;
    reservation.checkInDate = data.checkInDate;
    reservation.checkOutDate = data.checkOutDate;
    reservation.status = data.status;
    reservation.tenant = tenant;
    reservation.room = room;
    reservation.createdBy = createdBy;
    reservation.guest = null;
  }

  return reservationRepo.save(reservation);
}

async function upsertFolio(
  folioRepo: Repository<Folio>,
  data: {
    tenant: Tenant;
    reservation: Reservation;
    room: Room;
    createdBy: User;
    guestNameSnapshot: string;
    currency: string;
    status: FolioStatus;
    openedAt: Date;
    closedAt: Date | null;
  },
) {
  let folio = await folioRepo.findOne({
    where: {
      tenant: { id: data.tenant.id },
      reservation: { id: data.reservation.id },
    },
    relations: ['tenant', 'reservation', 'room', 'createdBy'],
  });

  if (!folio) {
    folio = folioRepo.create(data);
  } else {
    folio.room = data.room;
    folio.createdBy = data.createdBy;
    folio.guestNameSnapshot = data.guestNameSnapshot;
    folio.currency = data.currency;
    folio.status = data.status;
    folio.openedAt = data.openedAt;
    folio.closedAt = data.closedAt;
  }

  return folioRepo.save(folio);
}

async function upsertLineItem(
  lineItemRepo: Repository<FolioLineItem>,
  data: {
    tenant: Tenant;
    folio: Folio;
    postedBy: User | null;
    type: FolioLineItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    currency: string;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    paymentMethod: null;
    paymentReference: null;
  },
) {
  let lineItem = await lineItemRepo.findOne({
    where: {
      folio: { id: data.folio.id },
      type: data.type,
    },
    relations: ['folio'],
  });

  if (!lineItem) {
    lineItem = lineItemRepo.create(data);
  } else {
    lineItem.description = data.description;
    lineItem.quantity = data.quantity;
    lineItem.unitPrice = data.unitPrice;
    lineItem.totalAmount = data.totalAmount;
    lineItem.currency = data.currency;
    lineItem.relatedEntityType = data.relatedEntityType;
    lineItem.relatedEntityId = data.relatedEntityId;
    lineItem.postedBy = data.postedBy;
    lineItem.paymentMethod = data.paymentMethod;
    lineItem.paymentReference = data.paymentReference;
  }

  return lineItemRepo.save(lineItem);
}

async function ensureBarMenu(
  categoryRepo: Repository<BarCategory>,
  itemRepo: Repository<BarItem>,
  tenant: Tenant,
) {
  const categories = [
    {
      name: 'AC Bar Signatures',
      description: 'Premium air-conditioned bar menu for the lounge outlet',
      items: [
        { name: 'Smoked Negroni', sku: 'BAR-001', price: 520, taxRate: 0.18 },
        { name: 'Cucumber Collins', sku: 'BAR-002', price: 460, taxRate: 0.18 },
      ],
    },
    {
      name: 'Local Bar Favourites',
      description: 'Fast-moving local bar pours and beer selections',
      items: [
        { name: 'House Whisky Peg', sku: 'BAR-010', price: 260, taxRate: 0.18 },
        { name: 'Premium Lager Pint', sku: 'BAR-011', price: 290, taxRate: 0.18 },
      ],
    },
    {
      name: 'Bar Bites',
      description: 'Quick snacks served across AC bar and local bar outlets',
      items: [
        { name: 'Truffle Fries', sku: 'BAR-020', price: 320, taxRate: 0.05 },
        { name: 'Spiced Nuts Bowl', sku: 'BAR-021', price: 220, taxRate: 0.05 },
      ],
    },
  ];

  for (const [index, entry] of categories.entries()) {
    let category = await categoryRepo.findOne({
      where: { tenant: { id: tenant.id }, name: entry.name },
      relations: ['tenant'],
    });

    if (!category) {
      category = categoryRepo.create({
        tenant,
        name: entry.name,
        description: entry.description,
        sortOrder: index,
        isActive: true,
      });
    } else {
      category.description = entry.description;
      category.sortOrder = index;
      category.isActive = true;
    }

    category = await categoryRepo.save(category);

    for (const item of entry.items) {
      let existing = await itemRepo.findOne({
        where: { tenant: { id: tenant.id }, sku: item.sku },
        relations: ['tenant', 'category'],
      });

      if (!existing) {
        existing = itemRepo.create({
          tenant,
          category,
          name: item.name,
          description: null,
          sku: item.sku,
          price: item.price,
          currency: CURRENCY,
          taxRate: item.taxRate,
          isActive: true,
        });
      } else {
        existing.category = category;
        existing.name = item.name;
        existing.price = item.price;
        existing.currency = CURRENCY;
        existing.taxRate = item.taxRate;
        existing.isActive = true;
      }

      await itemRepo.save(existing);
    }
  }
}

async function ensureRestaurantMenu(
  categoryRepo: Repository<RestaurantCategory>,
  itemRepo: Repository<RestaurantItem>,
  tenant: Tenant,
) {
  const categories = [
    {
      name: 'Restaurant Signatures',
      description: 'Core all-day dining menu for the hotel restaurant',
      items: [
        { name: 'Paneer Butter Masala', sku: 'RST-001', price: 420, taxRate: 0.05 },
        { name: 'Herb Grilled Fish', sku: 'RST-002', price: 690, taxRate: 0.05 },
      ],
    },
    {
      name: 'Coffee Shop',
      description: 'Coffee shop beverages and quick bite menu',
      items: [
        { name: 'Cappuccino', sku: 'RST-010', price: 180, taxRate: 0.05 },
        { name: 'Club Sandwich', sku: 'RST-011', price: 260, taxRate: 0.05 },
      ],
    },
    {
      name: 'Breakfast',
      description: 'Morning dishes served through restaurant and coffee shop',
      items: [
        { name: 'Masala Omelette', sku: 'RST-020', price: 220, taxRate: 0.05 },
        { name: 'Idli Sambar', sku: 'RST-021', price: 180, taxRate: 0.05 },
      ],
    },
  ];

  for (const [index, entry] of categories.entries()) {
    let category = await categoryRepo.findOne({
      where: { tenant: { id: tenant.id }, name: entry.name },
      relations: ['tenant'],
    });

    if (!category) {
      category = categoryRepo.create({
        tenant,
        name: entry.name,
        description: entry.description,
        sortOrder: index,
        isActive: true,
      });
    } else {
      category.description = entry.description;
      category.sortOrder = index;
      category.isActive = true;
    }

    category = await categoryRepo.save(category);

    for (const item of entry.items) {
      let existing = await itemRepo.findOne({
        where: { tenant: { id: tenant.id }, sku: item.sku },
        relations: ['tenant', 'category'],
      });

      if (!existing) {
        existing = itemRepo.create({
          tenant,
          category,
          name: item.name,
          description: null,
          sku: item.sku,
          price: item.price,
          currency: CURRENCY,
          taxRate: item.taxRate,
          isActive: true,
        });
      } else {
        existing.category = category;
        existing.name = item.name;
        existing.price = item.price;
        existing.currency = CURRENCY;
        existing.taxRate = item.taxRate;
        existing.isActive = true;
      }

      await itemRepo.save(existing);
    }
  }
}

async function upsertGuest(
  guestRepo: Repository<Guest>,
  tenant: Tenant,
  createdBy: User,
  data: {
    fullName: string;
    email: string;
    phone: string | null;
    city: string | null;
    country: string | null;
    vip: boolean;
    notes: string | null;
  },
) {
  let guest = await guestRepo.findOne({
    where: { tenant: { id: tenant.id }, email: data.email },
    relations: ['tenant', 'createdBy'],
  });

  if (!guest) {
    guest = guestRepo.create({
      tenant,
      createdBy,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: null,
      nationality: null,
      idType: null,
      idNumber: null,
      addressLine1: null,
      addressLine2: null,
      city: data.city,
      state: null,
      postalCode: null,
      country: data.country,
      vip: data.vip,
      marketingOptIn: true,
      notes: data.notes,
      isActive: true,
    });
  } else {
    guest.fullName = data.fullName;
    guest.phone = data.phone;
    guest.city = data.city;
    guest.country = data.country;
    guest.vip = data.vip;
    guest.notes = data.notes;
    guest.isActive = true;
  }

  return guestRepo.save(guest);
}

async function ensureOperationsData(params: {
  tenant: Tenant;
  admin: User;
  staff: User;
  room101: Room;
  room102: Room;
  room103: Room;
  guest: Guest;
  housekeepingRepo: Repository<HousekeepingTask>;
  maintenanceRepo: Repository<MaintenanceRequest>;
  spaServiceRepo: Repository<SpaService>;
  spaAppointmentRepo: Repository<SpaAppointment>;
  conciergeRepo: Repository<TransportRequest>;
  laundryRepo: Repository<LaundryOrder>;
  notificationsRepo: Repository<Notification>;
  eventsRepo: Repository<Event>;
  supplierRepo: Repository<Supplier>;
  stockRepo: Repository<StockItem>;
  stockMovementRepo: Repository<StockMovement>;
  shiftRepo: Repository<Shift>;
  corporateRepo: Repository<CorporateAccount>;
  channelIntegrationRepo: Repository<ChannelIntegration>;
  channelLogRepo: Repository<ChannelSyncLog>;
  paymentTransactionRepo: Repository<PaymentTransaction>;
  billingFolio: Folio;
}) {
  const {
    tenant,
    admin,
    staff,
    room101,
    room102,
    room103,
    guest,
    housekeepingRepo,
    maintenanceRepo,
    spaServiceRepo,
    spaAppointmentRepo,
    conciergeRepo,
    laundryRepo,
    notificationsRepo,
    eventsRepo,
    supplierRepo,
    stockRepo,
    stockMovementRepo,
    shiftRepo,
    corporateRepo,
    channelIntegrationRepo,
    channelLogRepo,
    paymentTransactionRepo,
    billingFolio,
  } = params;

  await upsertHousekeepingTask(housekeepingRepo, tenant, room101, staff, {
    notes: 'Express clean before early arrival',
    priority: HousekeepingPriority.HIGH,
    status: HousekeepingStatus.IN_PROGRESS,
  });
  await upsertHousekeepingTask(housekeepingRepo, tenant, room103, staff, {
    notes: 'Post checkout deep clean',
    priority: HousekeepingPriority.NORMAL,
    status: HousekeepingStatus.PENDING,
  });

  await upsertMaintenanceRequest(maintenanceRepo, tenant, room102, admin, staff, {
    title: 'AC cooling check',
    description: 'Guest reported weak airflow in deluxe room',
    status: MaintenanceStatus.IN_PROGRESS,
  });

  const spaService = await upsertSpaService(spaServiceRepo, tenant, {
    name: 'Aroma Therapy',
    durationMinutes: 60,
    price: 2500,
  });

  await upsertSpaAppointment(spaAppointmentRepo, tenant, spaService, guest, staff, {
    startAt: addDays(new Date(), 1),
    endAt: addDays(new Date(Date.now() + 60 * 60 * 1000), 1),
    status: SpaAppointmentStatus.SCHEDULED,
  });

  await upsertTransportRequest(conciergeRepo, tenant, guest, {
    pickupLocation: 'Kempegowda Airport Terminal 2',
    dropoffLocation: `${DEMO_TENANT_NAME}, Residency Road`,
    pickupAt: addDays(new Date(), 1),
    status: 'CONFIRMED',
  });

  await upsertLaundryOrder(laundryRepo, tenant, guest, {
    description: '2 shirts and 1 blazer express service',
    amount: 480,
    completed: false,
  });

  await upsertNotification(notificationsRepo, tenant, admin, {
    channel: 'EMAIL',
    subject: 'VIP arrival alert',
    body: 'Neha Singh arrives tomorrow. Prepare suite amenities and welcome note.',
    sent: true,
  });

  await upsertEvent(eventsRepo, tenant, {
    name: 'Corporate Networking Dinner',
    startAt: addDays(new Date(), 2),
    endAt: addDays(new Date(Date.now() + 3 * 60 * 60 * 1000), 2),
    expectedGuests: 80,
    notes: 'Banquet hall setup with live pasta station.',
  });

  await upsertSupplier(supplierRepo, tenant, {
    name: 'FreshFarm Produce',
    contactEmail: 'ops@freshfarm.example',
  });

  const coffeeBeans = await upsertStockItem(stockRepo, tenant, {
    name: 'Arabica Coffee Beans',
    quantity: 18,
    unit: 'kg',
    unitCost: 780,
    reorderLevel: 8,
  });

  await upsertStockMovement(stockMovementRepo, tenant, coffeeBeans, {
    type: StockMovementType.PURCHASE,
    quantity: 24,
    unitCost: 760,
    reference: 'PO-2026-001',
    notes: 'Opening demo purchase for coffee inventory.',
  });

  await upsertStockMovement(stockMovementRepo, tenant, coffeeBeans, {
    type: StockMovementType.ISSUE,
    quantity: 6,
    unitCost: 780,
    reference: 'BAR-OPENING-001',
    notes: 'Opening stock issued to restaurant and bar operations.',
  });

  await upsertShift(shiftRepo, tenant, staff, {
    startAt: new Date(),
    endAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
  });

  await upsertCorporateAccount(corporateRepo, tenant, {
    name: 'Acme Corp',
    contactName: 'Finance Desk',
    contactEmail: 'finance@acme.example',
    contactPhone: '+91-9000000001',
    billingAddress: '100 Corporate Avenue, Bengaluru',
  });

  await upsertChannelIntegration(channelIntegrationRepo, tenant, {
    channelName: 'Booking.com',
    config: { hotelId: 'SUNU-DEMO-001', mode: 'sandbox' },
    isActive: true,
  });

  await upsertChannelSyncLog(channelLogRepo, tenant, {
    channelName: 'Booking.com',
    type: ChannelSyncType.AVAILABILITY,
    status: ChannelSyncStatus.SUCCESS,
    payload: { roomTypes: 2, dates: 30 },
    response: { synced: true },
    errorMessage: null,
  });

  await upsertPaymentTransaction(paymentTransactionRepo, tenant, admin, billingFolio, {
    provider: 'Razorpay',
    providerReference: 'rzp_demo_0001',
    amount: 500,
    status: PaymentStatus.CAPTURED,
    metadata: { cardType: 'VISA', last4: '4242' },
  });
}

async function upsertHousekeepingTask(
  repo: Repository<HousekeepingTask>,
  tenant: Tenant,
  room: Room,
  assignedTo: User,
  data: {
    notes: string;
    priority: HousekeepingPriority;
    status: HousekeepingStatus;
  },
) {
  let task = await repo.findOne({
    where: { tenant: { id: tenant.id }, room: { id: room.id }, notes: data.notes },
    relations: ['tenant', 'room', 'assignedTo'],
  });

  if (!task) {
    task = repo.create({
      tenant,
      room,
      assignedTo,
      status: data.status,
      priority: data.priority,
      notes: data.notes,
      dueAt: addDays(new Date(), 1),
    });
  } else {
    task.assignedTo = assignedTo;
    task.status = data.status;
    task.priority = data.priority;
    task.notes = data.notes;
  }

  return repo.save(task);
}

async function upsertMaintenanceRequest(
  repo: Repository<MaintenanceRequest>,
  tenant: Tenant,
  room: Room,
  reportedBy: User,
  assignedTo: User,
  data: {
    title: string;
    description: string;
    status: MaintenanceStatus;
  },
) {
  let request = await repo.findOne({
    where: { tenant: { id: tenant.id }, room: { id: room.id }, title: data.title },
    relations: ['tenant', 'room', 'reportedBy', 'assignedTo'],
  });

  if (!request) {
    request = repo.create({
      tenant,
      room,
      reportedBy,
      assignedTo,
      title: data.title,
      description: data.description,
      status: data.status,
      resolvedAt: null,
    });
  } else {
    request.assignedTo = assignedTo;
    request.description = data.description;
    request.status = data.status;
  }

  return repo.save(request);
}

async function upsertSpaService(
  repo: Repository<SpaService>,
  tenant: Tenant,
  data: { name: string; durationMinutes: number; price: number },
) {
  let service = await repo.findOne({
    where: { tenant: { id: tenant.id }, name: data.name },
    relations: ['tenant'],
  });

  if (!service) {
    service = repo.create({
      tenant,
      name: data.name,
      durationMinutes: data.durationMinutes,
      price: data.price,
      currency: CURRENCY,
      isActive: true,
    });
  } else {
    service.durationMinutes = data.durationMinutes;
    service.price = data.price;
    service.currency = CURRENCY;
    service.isActive = true;
  }

  return repo.save(service);
}

async function upsertSpaAppointment(
  repo: Repository<SpaAppointment>,
  tenant: Tenant,
  service: SpaService,
  guest: Guest,
  staff: User,
  data: { startAt: Date; endAt: Date; status: SpaAppointmentStatus },
) {
  let appointment = await repo.findOne({
    where: { tenant: { id: tenant.id }, service: { id: service.id }, guest: { id: guest.id } },
    relations: ['tenant', 'service', 'guest', 'staff'],
  });

  if (!appointment) {
    appointment = repo.create({
      tenant,
      service,
      guest,
      staff,
      startAt: data.startAt,
      endAt: data.endAt,
      status: data.status,
    });
  } else {
    appointment.staff = staff;
    appointment.startAt = data.startAt;
    appointment.endAt = data.endAt;
    appointment.status = data.status;
  }

  return repo.save(appointment);
}

async function upsertTransportRequest(
  repo: Repository<TransportRequest>,
  tenant: Tenant,
  guest: Guest,
  data: { pickupLocation: string; dropoffLocation: string; pickupAt: Date; status: string },
) {
  let request = await repo.findOne({
    where: { tenant: { id: tenant.id }, guest: { id: guest.id }, pickupLocation: data.pickupLocation },
    relations: ['tenant', 'guest'],
  });

  if (!request) {
    request = repo.create({
      tenant,
      guest,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupAt: data.pickupAt,
      status: data.status,
    });
  } else {
    request.dropoffLocation = data.dropoffLocation;
    request.pickupAt = data.pickupAt;
    request.status = data.status;
  }

  return repo.save(request);
}

async function upsertLaundryOrder(
  repo: Repository<LaundryOrder>,
  tenant: Tenant,
  guest: Guest,
  data: { description: string; amount: number; completed: boolean },
) {
  let order = await repo.findOne({
    where: { tenant: { id: tenant.id }, guest: { id: guest.id }, description: data.description },
    relations: ['tenant', 'guest'],
  });

  if (!order) {
    order = repo.create({
      tenant,
      guest,
      description: data.description,
      amount: data.amount,
      currency: CURRENCY,
      completed: data.completed,
    });
  } else {
    order.amount = data.amount;
    order.currency = CURRENCY;
    order.completed = data.completed;
  }

  return repo.save(order);
}

async function upsertNotification(
  repo: Repository<Notification>,
  tenant: Tenant,
  recipient: User,
  data: { channel: string; subject: string; body: string; sent: boolean },
) {
  let notification = await repo.findOne({
    where: { tenant: { id: tenant.id }, subject: data.subject },
    relations: ['tenant', 'recipient'],
  });

  if (!notification) {
    notification = repo.create({
      tenant,
      recipient,
      channel: data.channel,
      subject: data.subject,
      body: data.body,
      sent: data.sent,
    });
  } else {
    notification.recipient = recipient;
    notification.channel = data.channel;
    notification.body = data.body;
    notification.sent = data.sent;
  }

  return repo.save(notification);
}

async function upsertEvent(
  repo: Repository<Event>,
  tenant: Tenant,
  data: { name: string; startAt: Date; endAt: Date; expectedGuests: number; notes: string },
) {
  let event = await repo.findOne({
    where: { tenant: { id: tenant.id }, name: data.name },
    relations: ['tenant'],
  });

  if (!event) {
    event = repo.create({
      tenant,
      name: data.name,
      startAt: data.startAt,
      endAt: data.endAt,
      expectedGuests: data.expectedGuests,
      notes: data.notes,
    });
  } else {
    event.startAt = data.startAt;
    event.endAt = data.endAt;
    event.expectedGuests = data.expectedGuests;
    event.notes = data.notes;
  }

  return repo.save(event);
}

async function upsertSupplier(
  repo: Repository<Supplier>,
  tenant: Tenant,
  data: { name: string; contactEmail: string },
) {
  let supplier = await repo.findOne({
    where: { tenant: { id: tenant.id }, name: data.name },
    relations: ['tenant'],
  });

  if (!supplier) {
    supplier = repo.create({
      tenant,
      name: data.name,
      contactEmail: data.contactEmail,
    });
  } else {
    supplier.contactEmail = data.contactEmail;
  }

  return repo.save(supplier);
}

async function upsertStockItem(
  repo: Repository<StockItem>,
  tenant: Tenant,
  data: { name: string; quantity: number; unit: string; unitCost?: number; reorderLevel?: number },
) {
  let item = await repo.findOne({
    where: { tenant: { id: tenant.id }, name: data.name },
    relations: ['tenant'],
  });

  if (!item) {
    item = repo.create({
      tenant,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      unitCost: data.unitCost ?? 0,
      reorderLevel: data.reorderLevel ?? 0,
    });
  } else {
    item.quantity = data.quantity;
    item.unit = data.unit;
    item.unitCost = data.unitCost ?? item.unitCost ?? 0;
    item.reorderLevel = data.reorderLevel ?? item.reorderLevel ?? 0;
  }

  return repo.save(item);
}

async function upsertStockMovement(
  repo: Repository<StockMovement>,
  tenant: Tenant,
  stockItem: StockItem,
  data: {
    type: StockMovementType;
    quantity: number;
    unitCost?: number;
    reference?: string;
    notes?: string;
  },
) {
  const whereClause: {
    tenant: { id: string };
    stockItem: { id: string };
    type: StockMovementType;
    reference?: string;
  } = {
    tenant: { id: tenant.id },
    stockItem: { id: stockItem.id },
    type: data.type,
  };

  if (data.reference) {
    whereClause.reference = data.reference;
  }

  let movement = await repo.findOne({
    where: whereClause,
    relations: ['tenant', 'stockItem'],
  });

  if (!movement) {
    movement = repo.create({
      tenant,
      stockItem,
      type: data.type,
      quantity: data.quantity,
      unitCost: data.unitCost ?? null,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
    });
  } else {
    movement.quantity = data.quantity;
    movement.unitCost = data.unitCost ?? movement.unitCost ?? null;
    movement.reference = data.reference ?? movement.reference ?? null;
    movement.notes = data.notes ?? movement.notes ?? null;
  }

  return repo.save(movement);
}

async function upsertShift(
  repo: Repository<Shift>,
  tenant: Tenant,
  staff: User,
  data: { startAt: Date; endAt: Date },
) {
  let shift = await repo.findOne({
    where: { tenant: { id: tenant.id }, staff: { id: staff.id } },
    relations: ['tenant', 'staff'],
  });

  if (!shift) {
    shift = repo.create({
      tenant,
      staff,
      startAt: data.startAt,
      endAt: data.endAt,
    });
  } else {
    shift.startAt = data.startAt;
    shift.endAt = data.endAt;
  }

  return repo.save(shift);
}

async function upsertCorporateAccount(
  repo: Repository<CorporateAccount>,
  tenant: Tenant,
  data: {
    name: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    billingAddress: string;
  },
) {
  let account = await repo.findOne({
    where: { tenant: { id: tenant.id }, name: data.name },
    relations: ['tenant'],
  });

  if (!account) {
    account = repo.create({
      tenant,
      name: data.name,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      billingAddress: data.billingAddress,
      isActive: true,
    });
  } else {
    account.contactName = data.contactName;
    account.contactEmail = data.contactEmail;
    account.contactPhone = data.contactPhone;
    account.billingAddress = data.billingAddress;
    account.isActive = true;
  }

  return repo.save(account);
}

async function upsertChannelIntegration(
  repo: Repository<ChannelIntegration>,
  tenant: Tenant,
  data: { channelName: string; config: any; isActive: boolean },
) {
  let integration = await repo.findOne({
    where: { tenant: { id: tenant.id }, channelName: data.channelName },
    relations: ['tenant'],
  });

  if (!integration) {
    integration = repo.create({
      tenant,
      channelName: data.channelName,
      config: data.config,
      isActive: data.isActive,
    });
  } else {
    integration.config = data.config;
    integration.isActive = data.isActive;
  }

  return repo.save(integration);
}

async function upsertChannelSyncLog(
  repo: Repository<ChannelSyncLog>,
  tenant: Tenant,
  data: {
    channelName: string;
    type: ChannelSyncType;
    status: ChannelSyncStatus;
    payload: any;
    response: any;
    errorMessage: string | null;
  },
) {
  let log = await repo.findOne({
    where: { tenant: { id: tenant.id }, channelName: data.channelName, type: data.type },
    relations: ['tenant'],
    order: { createdAt: 'DESC' },
  });

  if (!log) {
    log = repo.create({
      tenant,
      channelName: data.channelName,
      type: data.type,
      status: data.status,
      payload: data.payload,
      response: data.response,
      errorMessage: data.errorMessage,
    });
  } else {
    log.status = data.status;
    log.payload = data.payload;
    log.response = data.response;
    log.errorMessage = data.errorMessage;
  }

  return repo.save(log);
}

async function upsertPaymentTransaction(
  repo: Repository<PaymentTransaction>,
  tenant: Tenant,
  createdBy: User,
  folio: Folio,
  data: {
    provider: string;
    providerReference: string;
    amount: number;
    status: PaymentStatus;
    metadata: any;
  },
) {
  let payment = await repo.findOne({
    where: { tenant: { id: tenant.id }, providerReference: data.providerReference },
    relations: ['tenant', 'createdBy', 'folio'],
  });

  if (!payment) {
    payment = repo.create({
      tenant,
      createdBy,
      folio,
      provider: data.provider,
      providerReference: data.providerReference,
      amount: data.amount,
      currency: CURRENCY,
      status: data.status,
      metadata: data.metadata,
    });
  } else {
    payment.createdBy = createdBy;
    payment.folio = folio;
    payment.provider = data.provider;
    payment.amount = data.amount;
    payment.currency = CURRENCY;
    payment.status = data.status;
    payment.metadata = data.metadata;
  }

  return repo.save(payment);
}

main().catch(async (error) => {
  console.error('Demo setup failed:', error);
  await dataSource.destroy().catch(() => undefined);
  process.exit(1);
});
