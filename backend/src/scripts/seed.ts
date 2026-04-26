// File Name: seed.ts
// Path: src/scripts/seed.ts

import dataSource from '../database/data-source';
import { Tenant } from '../modules/tenants/tenant.entity';
import { Room } from '../modules/rooms/room.entity';
import { User } from '../modules/users/user.entity';
import { RateCalendar } from '../modules/rms/entities/rate-calendar.entity';
import { Availability } from '../modules/rms/entities/availability.entity';
import { Restriction } from '../modules/rms/entities/restriction.entity';
import { BarCategory } from '../modules/bar/entities/bar-category.entity';
import { BarItem } from '../modules/bar/entities/bar-item.entity';
import { RestaurantCategory } from '../modules/restaurant/entities/restaurant-category.entity';
import { RestaurantItem } from '../modules/restaurant/entities/restaurant-item.entity';
import { CorporateAccount } from '../modules/corporate/entities/corporate-account.entity';
import { HousekeepingTask } from '../modules/housekeeping/entities/housekeeping-task.entity';
import { HousekeepingStatus } from '../modules/housekeeping/enums/housekeeping-status.enum';
import { HousekeepingPriority } from '../modules/housekeeping/enums/housekeeping-priority.enum';
import { MaintenanceRequest } from '../modules/maintenance/entities/maintenance-request.entity';
import { MaintenanceStatus } from '../modules/maintenance/enums/maintenance-status.enum';
import { HousekeepingInspection } from '../modules/housekeeping/entities/housekeeping-inspection.entity';
import { RoomStatus } from '../modules/rooms/enums/room-status.enum';

const DAYS = 30;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function seed() {
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const roomRepo = dataSource.getRepository(Room);
  const userRepo = dataSource.getRepository(User);
  const rateRepo = dataSource.getRepository(RateCalendar);
  const availabilityRepo = dataSource.getRepository(Availability);
  const restrictionRepo = dataSource.getRepository(Restriction);
  const barCategoryRepo = dataSource.getRepository(BarCategory);
  const barItemRepo = dataSource.getRepository(BarItem);
  const restaurantCategoryRepo = dataSource.getRepository(RestaurantCategory);
  const restaurantItemRepo = dataSource.getRepository(RestaurantItem);
  const corporateRepo = dataSource.getRepository(CorporateAccount);
  const housekeepingRepo = dataSource.getRepository(HousekeepingTask);
  const maintenanceRepo = dataSource.getRepository(MaintenanceRequest);
  const inspectionRepo = dataSource.getRepository(HousekeepingInspection);

  const tenants = await tenantRepo.find();
  const today = new Date();

  for (const tenant of tenants) {
    // Corporate accounts
    const corpCount = await corporateRepo.count({ where: { tenant: { id: tenant.id } } });
    if (corpCount === 0) {
      await corporateRepo.save([
        corporateRepo.create({
          tenant,
          name: 'Acme Corp',
          contactName: 'Finance Team',
          contactEmail: 'billing@acme.com',
          contactPhone: '+1-555-0100',
          billingAddress: '100 Corporate Way',
          isActive: true,
        }),
      ]);
    }

    // RMS calendars
    const rooms = await roomRepo.find({ where: { tenant: { id: tenant.id } } });
    const roomTypes = Array.from(new Set(rooms.map((room) => room.roomType)));
    for (const roomType of roomTypes) {
      const totalRooms = rooms.filter((room) => room.roomType === roomType).length;
      for (let i = 0; i < DAYS; i += 1) {
        const date = toDateOnly(addDays(today, i));
        await rateRepo.upsert(
          {
            tenant,
            roomType,
            date,
            baseRate: 1500,
            currency: 'INR',
            ratePlan: null,
          },
          ['tenant', 'roomType', 'date'],
        );
        await availabilityRepo.upsert(
          {
            tenant,
            roomType,
            date,
            totalRooms,
            availableRooms: totalRooms,
            stopSell: false,
          },
          ['tenant', 'roomType', 'date'],
        );
        await restrictionRepo.upsert(
          {
            tenant,
            roomType,
            date,
            minStay: 1,
            maxStay: null,
            closedToArrival: false,
            closedToDeparture: false,
            closed: false,
          },
          ['tenant', 'roomType', 'date'],
        );
      }
    }

    // Bar menu
    const barCategories = [
      { name: 'Cocktails', description: 'Signature and classic cocktails' },
      { name: 'Beer', description: 'Local and imported beers' },
      { name: 'Wine', description: 'Red, white, and sparkling' },
      { name: 'Snacks', description: 'Small bites and bar snacks' },
    ];

    for (const [index, cat] of barCategories.entries()) {
      let category = await barCategoryRepo.findOne({
        where: { tenant: { id: tenant.id }, name: cat.name },
      });
      if (!category) {
        category = await barCategoryRepo.save(
          barCategoryRepo.create({
            tenant,
            name: cat.name,
            description: cat.description,
            sortOrder: index,
            isActive: true,
          }),
        );
      }

      const items: Array<{ name: string; price: number }> =
        cat.name === 'Cocktails'
          ? [
              { name: 'Classic Mojito', price: 450 },
              { name: 'Negroni', price: 500 },
            ]
          : cat.name === 'Beer'
            ? [
                { name: 'Lager Pint', price: 300 },
                { name: 'IPA Pint', price: 350 },
              ]
            : cat.name === 'Wine'
              ? [
                  { name: 'House Red Glass', price: 400 },
                  { name: 'House White Glass', price: 400 },
                ]
              : [
                  { name: 'Spiced Nuts', price: 200 },
                  { name: 'Fries', price: 250 },
                ];

      for (const item of items) {
        const existing = await barItemRepo.findOne({
          where: { tenant: { id: tenant.id }, name: item.name, category: { id: category.id } },
        });
        if (!existing) {
          await barItemRepo.save(
            barItemRepo.create({
              tenant,
              category,
              name: item.name,
              description: null,
              sku: null,
              price: item.price,
              currency: 'INR',
              taxRate: 0,
              isActive: true,
            }),
          );
        }
      }
    }

    // Restaurant menu
    const restaurantCategories = [
      { name: 'Starters', description: 'Light bites' },
      { name: 'Mains', description: 'Hearty plates' },
      { name: 'Desserts', description: 'Sweet endings' },
    ];

    for (const [index, cat] of restaurantCategories.entries()) {
      let category = await restaurantCategoryRepo.findOne({
        where: { tenant: { id: tenant.id }, name: cat.name },
      });
      if (!category) {
        category = await restaurantCategoryRepo.save(
          restaurantCategoryRepo.create({
            tenant,
            name: cat.name,
            description: cat.description,
            sortOrder: index,
            isActive: true,
          }),
        );
      }

      const items: Array<{ name: string; price: number }> =
        cat.name === 'Starters'
          ? [
              { name: 'Tomato Soup', price: 300 },
              { name: 'Caesar Salad', price: 350 },
            ]
          : cat.name === 'Mains'
            ? [
                { name: 'Grilled Chicken', price: 650 },
                { name: 'Pasta Alfredo', price: 600 },
              ]
            : [
                { name: 'Chocolate Mousse', price: 280 },
                { name: 'Fruit Plate', price: 250 },
              ];

      for (const item of items) {
        const existing = await restaurantItemRepo.findOne({
          where: { tenant: { id: tenant.id }, name: item.name, category: { id: category.id } },
        });
        if (!existing) {
          await restaurantItemRepo.save(
            restaurantItemRepo.create({
              tenant,
              category,
              name: item.name,
              description: null,
              sku: null,
              price: item.price,
              currency: 'INR',
              taxRate: 0,
              isActive: true,
            }),
          );
        }
      }
    }
  }

  // Housekeeping tasks and maintenance requests
  for (const tenant of tenants) {
    const rooms = await roomRepo.find({ where: { tenant: { id: tenant.id } } });
    const staffUsers = await userRepo.find({ where: { tenant: { id: tenant.id } } });
    const firstStaff = staffUsers.length > 0 ? staffUsers[0] : null;

    if (rooms.length > 0 && firstStaff) {
      // Create housekeeping tasks for occupied rooms
      for (let i = 0; i < Math.min(3, rooms.length); i++) {
        const room = rooms[i];
        const existingTask = await housekeepingRepo.findOne({
          where: { tenant: { id: tenant.id }, room: { id: room.id } },
        });

        if (!existingTask) {
          await housekeepingRepo.save(
            housekeepingRepo.create({
              tenant,
              room,
              assignedTo: firstStaff,
              priority: i === 0 ? HousekeepingPriority.HIGH : HousekeepingPriority.NORMAL,
              notes: `Daily room cleaning for ${room.roomNumber}`,
              status:
                i === 0 ? HousekeepingStatus.ASSIGNED : HousekeepingStatus.PENDING,
              dueAt: new Date(),
            }),
          );
        }
      }

      // Create sample maintenance requests
      if (rooms.length > 1 && rooms[0].status !== RoomStatus.MAINTENANCE) {
        const maintenanceRoom = rooms[1];
        const existingMaintenance = await maintenanceRepo.findOne({
          where: {
            tenant: { id: tenant.id },
            room: { id: maintenanceRoom.id },
            status: MaintenanceStatus.OPEN,
          },
        });

        if (!existingMaintenance) {
          await maintenanceRepo.save(
            maintenanceRepo.create({
              tenant,
              room: maintenanceRoom,
              reportedBy: firstStaff,
              assignedTo: firstStaff,
              title: 'Air Conditioning Unit Maintenance',
              description: 'AC unit is not cooling properly. Needs inspection and repair.',
              status: MaintenanceStatus.IN_PROGRESS,
              resolvedAt: null,
            }),
          );
        }
      }

      // Create sample housekeeping inspections (some passing, some failing)
      if (rooms.length > 2) {
        const inspectionRoom = rooms[2];

        // Passing inspection
        const existingPassInspection = await inspectionRepo.findOne({
          where: {
            tenant: { id: tenant.id },
            room: { id: inspectionRoom.id },
            passed: true,
          },
        });

        if (!existingPassInspection) {
          await inspectionRepo.save(
            inspectionRepo.create({
              tenant,
              room: inspectionRoom,
              inspector: firstStaff,
              passed: true,
              notes: 'Room is clean and ready for guests.',
            }),
          );
        }
      }
    }
  }
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  await dataSource.destroy().catch(() => undefined);
  process.exit(1);
});
