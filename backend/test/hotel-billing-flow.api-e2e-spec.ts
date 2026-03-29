import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { Tenant } from '../src/modules/tenants/tenant.entity';
import { User } from '../src/modules/users/user.entity';
import { UserRole } from '../src/modules/users/enums/user-role.enum';

describe('Hotel Billing Flow (api e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const adminPassword = 'Admin@1234';
  const tenantCode = 'E2E_HOTEL';
  let adminEmail = 'e2e.admin@hotel.test';
  let staffEmail = 'e2e.staff@hotel.test';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query(`
      TRUNCATE TABLE
        audit_logs,
        invoices,
        folio_line_items,
        folios,
        reservations,
        rate_plans,
        rooms,
        guests,
        users,
        tenants
      RESTART IDENTITY CASCADE
    `);

    const tenantRepo = dataSource.getRepository(Tenant);
    const userRepo = dataSource.getRepository(User);

    const tenant = tenantRepo.create({
      code: tenantCode,
      name: 'E2E Hotel',
      isActive: true,
    });
    await tenantRepo.save(tenant);

    adminEmail = `e2e.admin+${Date.now()}@hotel.test`;
    const user = userRepo.create({
      fullName: 'E2E Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: UserRole.ADMIN,
      isActive: true,
      tenant,
    });
    await userRepo.save(user);

    staffEmail = `e2e.staff+${Date.now()}@hotel.test`;
    const staff = userRepo.create({
      fullName: 'E2E Staff',
      email: staffEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: UserRole.STAFF,
      isActive: true,
      tenant,
    });
    await userRepo.save(staff);
  });

  afterAll(async () => {
    await app.close();
  });

  it('reservation -> checkout -> folio -> payment -> invoice', async () => {
    const http = request(app.getHttpServer());

    const loginRes = await http
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);
    const token = loginRes.body.accessToken as string;

    const auth = { Authorization: `Bearer ${token}` };

    const roomRes = await http
      .post('/rooms')
      .set(auth)
      .send({
        roomNumber: '101',
        roomType: 'DELUXE',
        capacity: 2,
        tenantCode,
      })
      .expect(201);
    const roomId = roomRes.body.id as string;

    await http
      .post('/rate-plans')
      .set(auth)
      .send({
        code: 'BAR',
        name: 'Best Available Rate',
        basePrice: 275,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
      })
      .expect(201);

    const reservationRes = await http
      .post('/reservations')
      .set(auth)
      .send({
        roomId,
        guestFullName: 'Ravi Kumar',
        guestEmail: 'ravi.kumar@example.com',
        checkInDate: '2026-02-01',
        checkOutDate: '2026-02-05',
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
      .send({ status: 'CONFIRMED' })
      .expect(200);

    await http
      .patch(`/reservations/${reservationId}/status`)
      .set(auth)
      .send({ status: 'CHECKED_IN' })
      .expect(200);

    await http
      .patch(`/reservations/${reservationId}/status`)
      .set(auth)
      .send({ status: 'CHECKED_OUT' })
      .expect(200);

    const folioAfterCheckout = await http
      .get(`/folios/${reservationId}`)
      .set(auth)
      .expect(200);

    expect(folioAfterCheckout.body.status).toBe('CLOSED');
    const roomCharge = folioAfterCheckout.body.lineItems.find(
      (item: any) => item.type === 'ROOM_CHARGE',
    );
    expect(roomCharge).toBeDefined();
    expect(Number(roomCharge.totalAmount)).toBe(1100);

    const paymentKey = 'pay-e2e-001';
    const payment1 = await http
      .post(`/folios/${folioId}/payments`)
      .set(auth)
      .set('Idempotency-Key', paymentKey)
      .send({ method: 'CARD', amount: 500 })
      .expect(201);

    const payment2 = await http
      .post(`/folios/${folioId}/payments`)
      .set(auth)
      .set('Idempotency-Key', paymentKey)
      .send({ method: 'CARD', amount: 500 })
      .expect(201);
    expect(payment2.body.id).toBe(payment1.body.id);

    const invoice1 = await http
      .post(`/folios/${folioId}/invoice`)
      .set(auth)
      .set('Idempotency-Key', 'inv-e2e-001')
      .send({ gstRate: 0.12 })
      .expect(201);

    const invoice2 = await http
      .post(`/folios/${folioId}/invoice`)
      .set(auth)
      .set('Idempotency-Key', 'inv-e2e-001')
      .send({ gstRate: 0.12 })
      .expect(201);
    expect(invoice2.body.id).toBe(invoice1.body.id);

    const summary = await http
      .get(`/folios/${folioId}/summary`)
      .set(auth)
      .expect(200);

    expect(Number(summary.body.subtotal)).toBe(1100);
    expect(Number(summary.body.balanceDue)).toBe(600);
  });

  it('prevents STAFF from closing folio', async () => {
    const http = request(app.getHttpServer());

    const adminLogin = await http
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);
    const adminToken = adminLogin.body.accessToken as string;

    const staffLogin = await http
      .post('/auth/login')
      .send({ email: staffEmail, password: adminPassword })
      .expect(201);
    const staffToken = staffLogin.body.accessToken as string;

    const adminAuth = { Authorization: `Bearer ${adminToken}` };
    const staffAuth = { Authorization: `Bearer ${staffToken}` };

    const roomRes = await http
      .post('/rooms')
      .set(adminAuth)
      .send({
        roomNumber: '102',
        roomType: 'DELUXE',
        capacity: 2,
        tenantCode,
      })
      .expect(201);

    const reservationRes = await http
      .post('/reservations')
      .set(adminAuth)
      .send({
        roomId: roomRes.body.id,
        guestFullName: 'Staff Block Test',
        guestEmail: 'staff-block@test.com',
        checkInDate: '2026-03-01',
        checkOutDate: '2026-03-02',
      })
      .expect(201);

    const folio = await http
      .post('/folios')
      .set(adminAuth)
      .send({ reservationId: reservationRes.body.id })
      .expect(201);

    await http
      .patch(`/folios/${folio.body.id}/close`)
      .set(staffAuth)
      .expect(403);
  });
});
