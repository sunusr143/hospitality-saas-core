import 'dotenv/config';
import * as bcrypt from 'bcrypt';

import dataSource from '../database/data-source';
import { Tenant } from '../modules/tenants/tenant.entity';
import { User } from '../modules/users/user.entity';
import { UserRole } from '../modules/users/enums/user-role.enum';
import { Room } from '../modules/rooms/room.entity';
import { RoomStatus } from '../modules/rooms/enums/room-status.enum';

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

function toRoomLayout() {
  const deluxeCount = Number(process.env.PRODUCTION_DELUXE_ROOMS || 10);
  const suiteCount = Number(process.env.PRODUCTION_SUITE_ROOMS || 2);
  const rooms: Array<{ roomNumber: string; roomType: string; capacity: number }> = [];

  for (let index = 0; index < deluxeCount; index += 1) {
    rooms.push({
      roomNumber: String(101 + index),
      roomType: 'DELUXE',
      capacity: 2,
    });
  }

  for (let index = 0; index < suiteCount; index += 1) {
    rooms.push({
      roomNumber: String(201 + index),
      roomType: 'SUITE',
      capacity: 3,
    });
  }

  return rooms;
}

async function reconcileRooms(params: {
  roomRepo: ReturnType<typeof dataSource.getRepository<Room>>;
  tenant: Tenant;
  desiredRooms: Array<{ roomNumber: string; roomType: string; capacity: number }>;
}) {
  const { roomRepo, tenant, desiredRooms } = params;
  const existingRooms = await roomRepo.find({
    where: { tenant: { id: tenant.id } },
    relations: ['tenant'],
  });

  const existingByNumber = new Map(existingRooms.map((room) => [room.roomNumber, room]));
  const desiredNumbers = new Set(desiredRooms.map((room) => room.roomNumber));

  let created = 0;
  let updated = 0;

  for (const roomData of desiredRooms) {
    const existing = existingByNumber.get(roomData.roomNumber);

    if (!existing) {
      await roomRepo.save(
        roomRepo.create({
          tenant,
          roomNumber: roomData.roomNumber,
          roomType: roomData.roomType,
          capacity: roomData.capacity,
          status: RoomStatus.AVAILABLE,
        }),
      );
      created += 1;
      continue;
    }

    const changed =
      existing.roomType !== roomData.roomType ||
      Number(existing.capacity) !== roomData.capacity;

    if (changed) {
      existing.roomType = roomData.roomType;
      existing.capacity = roomData.capacity;
      if (!existing.status) {
        existing.status = RoomStatus.AVAILABLE;
      }
      await roomRepo.save(existing);
      updated += 1;
    }
  }

  const extraRooms = existingRooms.filter((room) => !desiredNumbers.has(room.roomNumber));

  return {
    created,
    updated,
    expected: desiredRooms.length,
    actual: existingRooms.length + created,
    extraRooms: extraRooms.map((room) => ({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      status: room.status,
    })),
  };
}

async function main() {
  if ((process.env.APP_MODE ?? 'production') !== 'production') {
    console.log(`APP_MODE=${process.env.APP_MODE}. Continuing production setup because this command was invoked explicitly.`);
  }

  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);
  const roomRepo = dataSource.getRepository(Room);

  const tenantCode = required('PRODUCTION_TENANT_CODE').toUpperCase();
  const tenantName = required('PRODUCTION_TENANT_NAME');
  const adminEmail = required('PRODUCTION_ADMIN_EMAIL').toLowerCase();
  const adminPassword = required('PRODUCTION_ADMIN_PASSWORD');

  let tenant = await tenantRepo.findOne({ where: { code: tenantCode } });

  if (!tenant) {
    tenant = tenantRepo.create({
      code: tenantCode,
      name: tenantName,
      softwareName: optional('PRODUCTION_SOFTWARE_NAME', 'Hospitality'),
      contactEmail: optional('PRODUCTION_CONTACT_EMAIL', adminEmail),
      contactPhone: optional('PRODUCTION_CONTACT_PHONE', null as unknown as string),
      addressLine1: optional('PRODUCTION_ADDRESS', null as unknown as string),
      city: optional('PRODUCTION_CITY', null as unknown as string),
      country: optional('PRODUCTION_COUNTRY', null as unknown as string),
      currencyCode: optional('PRODUCTION_CURRENCY', 'INR'),
      timezone: optional('PRODUCTION_TIMEZONE', 'Asia/Kolkata'),
      checkInTime: optional('PRODUCTION_CHECKIN_TIME', '14:00'),
      checkOutTime: optional('PRODUCTION_CHECKOUT_TIME', '11:00'),
      enabledModules: [...Tenant.DEFAULT_ENABLED_MODULES],
      isActive: true,
    });
  } else {
    tenant.name = tenantName;
    tenant.softwareName = optional('PRODUCTION_SOFTWARE_NAME', tenant.softwareName || 'Hospitality');
    tenant.contactEmail = optional('PRODUCTION_CONTACT_EMAIL', adminEmail) || tenant.contactEmail;
    tenant.contactPhone = optional('PRODUCTION_CONTACT_PHONE', tenant.contactPhone ?? '');
    tenant.addressLine1 = optional('PRODUCTION_ADDRESS', tenant.addressLine1 ?? '');
    tenant.city = optional('PRODUCTION_CITY', tenant.city ?? '');
    tenant.country = optional('PRODUCTION_COUNTRY', tenant.country ?? '');
    tenant.currencyCode = optional('PRODUCTION_CURRENCY', tenant.currencyCode || 'INR');
    tenant.timezone = optional('PRODUCTION_TIMEZONE', tenant.timezone || 'Asia/Kolkata');
    tenant.checkInTime = optional('PRODUCTION_CHECKIN_TIME', tenant.checkInTime || '14:00');
    tenant.checkOutTime = optional('PRODUCTION_CHECKOUT_TIME', tenant.checkOutTime || '11:00');
    tenant.enabledModules = tenant.enabledModules?.length
      ? tenant.enabledModules
      : [...Tenant.DEFAULT_ENABLED_MODULES];
    tenant.isActive = true;
  }

  tenant = await tenantRepo.save(tenant);

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  let admin = await userRepo.findOne({
    where: { email: adminEmail, tenant: { id: tenant.id } },
    relations: ['tenant'],
  });

  if (!admin) {
    admin = userRepo.create({
      tenant,
      fullName: optional('PRODUCTION_ADMIN_NAME', 'System Administrator'),
      email: adminEmail,
      password: passwordHash,
      phone: optional('PRODUCTION_ADMIN_PHONE', null as unknown as string),
      title: optional('PRODUCTION_ADMIN_TITLE', 'General Manager'),
      department: 'Administration',
      addressLine1: optional('PRODUCTION_ADDRESS', null as unknown as string),
      photoUrl: null,
      notes: 'Primary production administrator',
      role: UserRole.ADMIN,
      isActive: true,
    });
  } else {
    admin.fullName = optional('PRODUCTION_ADMIN_NAME', admin.fullName);
    admin.password = passwordHash;
    admin.phone = optional('PRODUCTION_ADMIN_PHONE', admin.phone ?? '');
    admin.title = optional('PRODUCTION_ADMIN_TITLE', admin.title ?? 'General Manager');
    admin.department = 'Administration';
    admin.addressLine1 = optional('PRODUCTION_ADDRESS', admin.addressLine1 ?? '');
    admin.role = UserRole.ADMIN;
    admin.isActive = true;
  }

  await userRepo.save(admin);

  const roomSummary = await reconcileRooms({
    roomRepo,
    tenant,
    desiredRooms: toRoomLayout(),
  });

  console.log('Production tenant initialized.');
  console.log(`Tenant: ${tenant.code} · ${tenant.name}`);
  console.log(`Admin login: ${adminEmail}`);
  console.log(`Rooms expected: ${roomSummary.expected} · created: ${roomSummary.created} · updated: ${roomSummary.updated}`);
  if (roomSummary.extraRooms.length > 0) {
    console.log(`Extra rooms kept for safety: ${roomSummary.extraRooms.map((room) => room.roomNumber).join(', ')}`);
  }

  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Production setup failed:', error);
  process.exit(1);
});
