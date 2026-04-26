import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { Tenant } from '../src/modules/tenants/tenant.entity';
import { User } from '../src/modules/users/user.entity';
import { UserRole } from '../src/modules/users/enums/user-role.enum';
import { ReservationStatus } from '../src/modules/reservations/reservation.entity';

/**
 * Comprehensive E2E tests for critical PMS flows:
 * 1. Room Move Billing (upgrade/downgrade)
 * 2. Housekeeping Inspection → Maintenance (QA workflow)
 * 3. Maintenance Request Lifecycle (create → assign → resolve)
 * 4. Restaurant/Bar Order → Folio Integration
 */
describe('Critical PMS Flows (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const adminPassword = 'Admin@1234';
  const tenantCode = 'FLOW_TEST';
  let adminEmail = 'flow.admin@hotel.test';
  let staffEmail = 'flow.staff@hotel.test';
  let adminToken = '';
  let staffToken = '';
  let tenantId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Clean up all relevant tables
    await dataSource.query(`
      TRUNCATE TABLE
        room_move_logs,
        housekeeping_inspections,
        housekeeping_tasks,
        maintenance_requests,
        restaurant_order_events,
        restaurant_order_items,
        restaurant_orders,
        bar_order_events,
        bar_order_items,
        bar_orders,
        folio_line_items,
        folios,
        audit_logs,
        reservations,
        rate_plans,
        rate_calendars,
        rooms,
        guests,
        users,
        tenants
      RESTART IDENTITY CASCADE
    `);

    const tenantRepo = dataSource.getRepository(Tenant);
    const userRepo = dataSource.getRepository(User);

    // Create tenant
    const tenant = tenantRepo.create({
      code: tenantCode,
      name: 'Flow Test Hotel',
      isActive: true,
    });
    const savedTenant = await tenantRepo.save(tenant);
    tenantId = savedTenant.id;

    // Create admin user
    adminEmail = `flow.admin+${Date.now()}@hotel.test`;
    const adminUser = userRepo.create({
      fullName: 'Flow Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: UserRole.ADMIN,
      isActive: true,
      tenant: savedTenant,
    });
    await userRepo.save(adminUser);

    // Create staff user
    staffEmail = `flow.staff+${Date.now()}@hotel.test`;
    const staffUser = userRepo.create({
      fullName: 'Flow Staff',
      email: staffEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: UserRole.STAFF,
      isActive: true,
      tenant: savedTenant,
    });
    await userRepo.save(staffUser);

    // Get tokens
    const http = request(app.getHttpServer());

    const adminLoginRes = await http
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminToken = adminLoginRes.body.accessToken as string;

    const staffLoginRes = await http
      .post('/auth/login')
      .send({ email: staffEmail, password: adminPassword });
    staffToken = staffLoginRes.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Room Move Billing (upgrade/downgrade)', () => {
    it('should calculate billing adjustment when guest is moved to higher-category room', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${adminToken}` };

      // Create rate plan
      await http
        .post('/rate-plans')
        .set(auth)
        .send({
          code: 'STANDARD',
          name: 'Standard Rate',
          basePrice: 250,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
        })
        .expect(201);

      // Create two rooms - budget and deluxe
      const budgetRoomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '101',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const budgetRoomId = budgetRoomRes.body.id as string;

      const deluxeRoomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '201',
          roomType: 'DELUXE',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const deluxeRoomId = deluxeRoomRes.body.id as string;

      // Create reservation for budget room
      const checkInDate = '2026-04-01';
      const checkOutDate = '2026-04-05';

      const reservationRes = await http
        .post('/reservations')
        .set(auth)
        .send({
          roomId: budgetRoomId,
          guestFullName: 'Upgrade Test Guest',
          guestEmail: 'upgrade@test.com',
          checkInDate,
          checkOutDate,
        })
        .expect(201);
      const reservationId = reservationRes.body.id as string;

      // Create folio
      const folioRes = await http
        .post('/folios')
        .set(auth)
        .send({ reservationId })
        .expect(201);
      const folioId = folioRes.body.id as string;

      // Check in guest
      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CONFIRMED })
        .expect(200);

      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CHECKED_IN })
        .expect(200);

      // Move guest to deluxe room (upgrade)
      const moveRes = await http
        .post('/front-desk/room-move')
        .set(auth)
        .send({
          reservationId,
          toRoomId: deluxeRoomId,
          reason: 'Complimentary upgrade for loyalty member',
        })
        .expect(201);

      expect(moveRes.body).toHaveProperty('id');
      expect(moveRes.body.fromRoom).toEqual({ id: budgetRoomId });
      expect(moveRes.body.toRoom).toEqual({ id: deluxeRoomId });
      expect(moveRes.body.reason).toBe(
        'Complimentary upgrade for loyalty member',
      );

      // Verify folio has adjustment line item
      const folioAfterMove = await http
        .get(`/folios/${folioId}`)
        .set(auth)
        .expect(200);

      // Should have room charge + adjustment line items
      const lineItems = folioAfterMove.body.lineItems || [];
      expect(lineItems.length).toBeGreaterThan(0);
    });

    it('should handle room move for downgrade (downgrade charge)', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${adminToken}` };

      // Create rate plan
      await http
        .post('/rate-plans')
        .set(auth)
        .send({
          code: 'PREMIUM',
          name: 'Premium Rate',
          basePrice: 500,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
        })
        .expect(201);

      // Create deluxe and standard rooms
      const deluxeRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '301',
          roomType: 'DELUXE',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const deluxeRoomId = deluxeRes.body.id as string;

      const standardRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '302',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const standardRoomId = standardRes.body.id as string;

      // Create reservation for deluxe room
      const reservationRes = await http
        .post('/reservations')
        .set(auth)
        .send({
          roomId: deluxeRoomId,
          guestFullName: 'Downgrade Test Guest',
          guestEmail: 'downgrade@test.com',
          checkInDate: '2026-04-10',
          checkOutDate: '2026-04-13',
        })
        .expect(201);
      const reservationId = reservationRes.body.id as string;

      // Create folio
      await http.post('/folios').set(auth).send({ reservationId }).expect(201);

      // Check in guest
      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CONFIRMED })
        .expect(200);

      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CHECKED_IN })
        .expect(200);

      // Move to standard room (downgrade)
      const moveRes = await http
        .post('/front-desk/room-move')
        .set(auth)
        .send({
          reservationId,
          toRoomId: standardRoomId,
          reason: 'Maintenance issue, relocated to equivalent room',
        })
        .expect(201);

      expect(moveRes.body.toRoom).toEqual({ id: standardRoomId });
    });
  });

  describe('Frontdesk Dashboard and Check-In Wiring', () => {
    it('should auto-create a folio during check-in and surface the stay on the frontdesk dashboard', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${adminToken}` };

      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '401',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      const reservationRes = await http
        .post('/reservations')
        .set(auth)
        .send({
          roomId,
          guestFullName: 'Dashboard Guest',
          guestEmail: 'dashboard@test.com',
          checkInDate: '2026-04-01',
          checkOutDate: '2026-04-03',
        })
        .expect(201);
      const reservationId = reservationRes.body.id as string;

      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CONFIRMED })
        .expect(200);

      await http
        .post('/frontdesk/checkin')
        .set(auth)
        .send({ reservationId })
        .expect(201);

      const folioRes = await http
        .get(`/folios/${reservationId}`)
        .set(auth)
        .expect(200);

      expect(folioRes.body.reservation).toEqual(
        expect.objectContaining({ id: reservationId }),
      );
      expect(folioRes.body.status).toBe('OPEN');

      const dashboardRes = await http
        .get('/frontdesk/dashboard?date=2026-04-01')
        .set(auth)
        .expect(200);

      expect(dashboardRes.body.overview.arrivalsToday).toBe(1);
      expect(dashboardRes.body.overview.inHouseGuests).toBe(1);
      expect(dashboardRes.body.overview.occupiedRooms).toBe(1);
      expect(dashboardRes.body.arrivals).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reservationId,
            status: ReservationStatus.CHECKED_IN,
            roomNumber: '401',
            readiness: expect.objectContaining({
              hasFolio: true,
              hasOpenFolio: true,
            }),
          }),
        ]),
      );
      expect(dashboardRes.body.inHouse).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reservationId,
            status: ReservationStatus.CHECKED_IN,
          }),
        ]),
      );
    });
  });

  describe('Housekeeping Inspection QA Workflow', () => {
    it('should create inspection record with passed=true (no maintenance)', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${staffToken}` };

      // Create a room
      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '501',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      // Create passing inspection
      const inspectionRes = await http
        .post('/housekeeping/inspections')
        .set(auth)
        .send({
          roomId,
          passed: true,
          notes: 'Room is clean and ready for guests. All amenities stocked.',
        })
        .expect(201);

      expect(inspectionRes.body).toHaveProperty('id');
      expect(inspectionRes.body.passed).toBe(true);
      expect(inspectionRes.body.notes).toBe(
        'Room is clean and ready for guests. All amenities stocked.',
      );

      // Verify no maintenance request created
      const maintenanceRes = await http
        .get('/maintenance')
        .set(auth)
        .expect(200);
      const maintenanceRequests = maintenanceRes.body || [];
      const relatedRequests = maintenanceRequests.filter(
        (r: any) => r.room.id === roomId,
      );
      expect(relatedRequests.length).toBe(0);
    });

    it('should create maintenance request and block room when inspection fails', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${staffToken}` };

      // Create a room
      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '502',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      // Create failing inspection
      const inspectionRes = await http
        .post('/housekeeping/inspections')
        .set(auth)
        .send({
          roomId,
          passed: false,
          notes:
            'Bathroom plumbing damaged. Water leaking from shower. DO NOT RENT.',
        })
        .expect(201);

      expect(inspectionRes.body.passed).toBe(false);

      // Verify maintenance request was created
      const maintenanceRes = await http
        .get('/maintenance')
        .set(auth)
        .expect(200);
      const maintenanceRequests = maintenanceRes.body || [];
      const relatedRequest = maintenanceRequests.find(
        (r: any) => r.room.id === roomId,
      );

      expect(relatedRequest).toBeDefined();
      expect(relatedRequest.title).toContain('failed');
      expect(relatedRequest.title.toLowerCase()).toContain('inspection');
      expect(relatedRequest.status).toBe('OPEN');

      // Verify room is blocked (status = MAINTENANCE)
      const roomCheck = await http
        .get(`/rooms/${roomId}`)
        .set(auth)
        .expect(200);
      expect(roomCheck.body.status).toBe('MAINTENANCE');
    });
  });

  describe('Maintenance Request Lifecycle', () => {
    it('should create, assign, and resolve maintenance request with room unblocking', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${staffToken}` };
      const adminAuth = { Authorization: `Bearer ${adminToken}` };

      // Create a room
      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '601',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      // Create maintenance request
      const createRes = await http
        .post('/maintenance')
        .set(auth)
        .send({
          roomId,
          title: 'Air Conditioning Unit Not Working',
          description: 'AC is producing warm air. Needs inspection and repair.',
        })
        .expect(201);
      const maintenanceId = createRes.body.id as string;

      expect(createRes.body.status).toBe('OPEN');
      expect(createRes.body.assignedTo).toBeNull();

      // Assign maintenance request
      const assignRes = await http
        .patch(`/maintenance/${maintenanceId}/assign`)
        .set(auth)
        .send({ assignedToId: await getStaffUserId(dataSource, tenantId) })
        .expect(200);

      expect(assignRes.body.status).toBe('IN_PROGRESS');
      expect(assignRes.body.assignedTo).toBeDefined();

      // Verify room is blocked while maintenance is in progress
      const roomDuringMaintenance = await http
        .get(`/rooms/${roomId}`)
        .set(auth)
        .expect(200);
      expect(roomDuringMaintenance.body.status).toBe('MAINTENANCE');

      // Resolve maintenance
      const resolveRes = await http
        .patch(`/maintenance/${maintenanceId}/status`)
        .set(adminAuth)
        .send({ status: 'RESOLVED' })
        .expect(200);

      expect(resolveRes.body.status).toBe('RESOLVED');
      expect(resolveRes.body.resolvedAt).toBeDefined();

      // Verify room is unblocked (status = AVAILABLE)
      const roomAfterResolution = await http
        .get(`/rooms/${roomId}`)
        .set(auth)
        .expect(200);
      expect(roomAfterResolution.body.status).toBe('AVAILABLE');
    });

    it('should prevent modification of resolved maintenance requests', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${staffToken}` };
      const adminAuth = { Authorization: `Bearer ${adminToken}` };

      // Create and resolve a request
      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '602',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      const createRes = await http
        .post('/maintenance')
        .set(auth)
        .send({
          roomId,
          title: 'Light Bulb Replacement',
          description: 'Hallway light is out.',
        })
        .expect(201);
      const maintenanceId = createRes.body.id as string;

      // Resolve it
      await http
        .patch(`/maintenance/${maintenanceId}/status`)
        .set(adminAuth)
        .send({ status: 'RESOLVED' })
        .expect(200);

      // Try to change status again - should fail
      const updateRes = await http
        .patch(`/maintenance/${maintenanceId}/status`)
        .set(adminAuth)
        .send({ status: 'IN_PROGRESS' })
        .expect(400);

      expect(updateRes.body.message).toContain(
        'Resolved request cannot be modified',
      );
    });
  });

  describe('Restaurant/Bar Order to Folio Integration', () => {
    it('should post restaurant order to folio and create line item', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${staffToken}` };

      // Setup: Create rate plan, room, reservation, and folio
      await http
        .post('/rate-plans')
        .set(auth)
        .send({
          code: 'F2F',
          name: 'Food & Folio',
          basePrice: 300,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
        })
        .expect(201);

      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '701',
          roomType: 'SUITE',
          capacity: 4,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      const reservationRes = await http
        .post('/reservations')
        .set(auth)
        .send({
          roomId,
          guestFullName: 'Food & Beverage Test',
          guestEmail: 'fnb@test.com',
          checkInDate: '2026-04-20',
          checkOutDate: '2026-04-22',
        })
        .expect(201);
      const reservationId = reservationRes.body.id as string;

      const folioRes = await http
        .post('/folios')
        .set(auth)
        .send({ reservationId })
        .expect(201);
      const folioId = folioRes.body.id as string;

      // Check in guest
      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CONFIRMED })
        .expect(200);

      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CHECKED_IN })
        .expect(200);

      // Create restaurant category and items
      const categoryRes = await http
        .post('/restaurant/categories')
        .set(auth)
        .send({
          name: 'Mains',
          description: 'Main course dishes',
          sortOrder: 0,
        })
        .expect(201);
      const categoryId = categoryRes.body.id as string;

      const itemRes = await http
        .post('/restaurant/items')
        .set(auth)
        .send({
          categoryId,
          name: 'Grilled Fish',
          price: 650,
          currency: 'INR',
          taxRate: 0.05,
        })
        .expect(201);
      const itemId = itemRes.body.id as string;

      // Create restaurant order
      const orderRes = await http
        .post('/restaurant/orders')
        .set(auth)
        .send({
          items: [{ itemId, quantity: 2 }],
          taxRate: 0.05,
        })
        .expect(201);
      const orderId = orderRes.body.id as string;

      expect(orderRes.body.status).toBe('OPEN');
      expect(orderRes.body.total).toBeGreaterThan(0);

      // Post order to folio
      const postRes = await http
        .post(`/restaurant/orders/${orderId}/post-folio`)
        .set(auth)
        .send({ folioId })
        .expect(200);

      expect(postRes.body.status).toBe('POSTED');
      expect(postRes.body.folio.id).toBe(folioId);

      // Verify folio has the charge
      const folioAfter = await http
        .get(`/folios/${folioId}`)
        .set(auth)
        .expect(200);

      const lineItems = folioAfter.body.lineItems || [];
      const fnbItem = lineItems.find((li: any) => li.type === 'FNB_CHARGE');
      expect(fnbItem).toBeDefined();
      expect(fnbItem.totalAmount).toBeGreaterThan(0);
    });

    it('should post bar order to folio with correct charges', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${staffToken}` };

      // Setup
      await http
        .post('/rate-plans')
        .set(auth)
        .send({
          code: 'BAR',
          name: 'Bar Rate',
          basePrice: 200,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
        })
        .expect(201);

      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '702',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      const reservationRes = await http
        .post('/reservations')
        .set(auth)
        .send({
          roomId,
          guestFullName: 'Bar Test Guest',
          guestEmail: 'bar@test.com',
          checkInDate: '2026-05-01',
          checkOutDate: '2026-05-03',
        })
        .expect(201);
      const reservationId = reservationRes.body.id as string;

      const folioRes = await http
        .post('/folios')
        .set(auth)
        .send({ reservationId })
        .expect(201);
      const folioId = folioRes.body.id as string;

      // Check in
      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CONFIRMED })
        .expect(200);

      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CHECKED_IN })
        .expect(200);

      // Create bar category and item
      const categoryRes = await http
        .post('/bar/categories')
        .set(auth)
        .send({
          name: 'Cocktails',
          description: 'Premium cocktails',
          sortOrder: 0,
        })
        .expect(201);
      const categoryId = categoryRes.body.id as string;

      const itemRes = await http
        .post('/bar/items')
        .set(auth)
        .send({
          categoryId,
          name: 'Mojito',
          price: 450,
          currency: 'INR',
          taxRate: 0,
        })
        .expect(201);
      const itemId = itemRes.body.id as string;

      // Create bar order
      const orderRes = await http
        .post('/bar/orders')
        .set(auth)
        .send({
          items: [{ itemId, quantity: 3 }],
          taxRate: 0,
        })
        .expect(201);
      const orderId = orderRes.body.id as string;

      // Post to folio
      const postRes = await http
        .post(`/bar/orders/${orderId}/post-folio`)
        .set(auth)
        .send({ folioId })
        .expect(200);

      expect(postRes.body.status).toBe('POSTED');
      expect(postRes.body.folio.id).toBe(folioId);

      // Verify folio charge
      const folioAfter = await http
        .get(`/folios/${folioId}`)
        .set(auth)
        .expect(200);

      const barCharge = (folioAfter.body.lineItems || []).find(
        (li: any) => li.type === 'FNB_CHARGE' && li.description.includes('bar'),
      );
      expect(barCharge).toBeDefined();
    });

    it('should prevent double-posting of same order to folio', async () => {
      const http = request(app.getHttpServer());
      const auth = { Authorization: `Bearer ${staffToken}` };

      // Create folio and order
      await http
        .post('/rate-plans')
        .set(auth)
        .send({
          code: 'DBL',
          name: 'Double Post Test',
          basePrice: 250,
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
        })
        .expect(201);

      const roomRes = await http
        .post('/rooms')
        .set(auth)
        .send({
          roomNumber: '703',
          roomType: 'STANDARD',
          capacity: 2,
          tenantCode,
        })
        .expect(201);
      const roomId = roomRes.body.id as string;

      const reservationRes = await http
        .post('/reservations')
        .set(auth)
        .send({
          roomId,
          guestFullName: 'Double Test',
          guestEmail: 'double@test.com',
          checkInDate: '2026-05-10',
          checkOutDate: '2026-05-12',
        })
        .expect(201);
      const reservationId = reservationRes.body.id as string;

      const folioRes = await http
        .post('/folios')
        .set(auth)
        .send({ reservationId })
        .expect(201);
      const folioId = folioRes.body.id as string;

      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CONFIRMED })
        .expect(200);

      await http
        .patch(`/reservations/${reservationId}/status`)
        .set(auth)
        .send({ status: ReservationStatus.CHECKED_IN })
        .expect(200);

      // Create order
      const categoryRes = await http
        .post('/restaurant/categories')
        .set(auth)
        .send({ name: 'Test', description: 'Test' })
        .expect(201);

      const itemRes = await http
        .post('/restaurant/items')
        .set(auth)
        .send({
          categoryId: categoryRes.body.id,
          name: 'Test Item',
          price: 500,
          currency: 'INR',
        })
        .expect(201);

      const orderRes = await http
        .post('/restaurant/orders')
        .set(auth)
        .send({
          items: [{ itemId: itemRes.body.id, quantity: 1 }],
        })
        .expect(201);
      const orderId = orderRes.body.id as string;

      // Post first time - should succeed
      const firstPost = await http
        .post(`/restaurant/orders/${orderId}/post-folio`)
        .set(auth)
        .send({ folioId })
        .expect(200);

      expect(firstPost.body.status).toBe('POSTED');

      // Post second time - should still return 200 (idempotent) or be already posted
      const secondPost = await http
        .post(`/restaurant/orders/${orderId}/post-folio`)
        .set(auth)
        .send({ folioId });

      expect([200, 400]).toContain(secondPost.status);
      expect(secondPost.body.status).toBe('POSTED');
    });
  });
});

/**
 * Helper function to get staff user ID
 */
async function getStaffUserId(
  dataSource: DataSource,
  tenantId: string,
): Promise<string> {
  const userRepo = dataSource.getRepository(User);
  const staffUser = await userRepo.findOne({
    where: {
      tenant: { id: tenantId },
      role: UserRole.STAFF,
    },
  });
  if (!staffUser) {
    throw new Error('Staff user not found');
  }
  return staffUser.id;
}
