# Architecture & Module Map

This document describes the backend architecture, module wiring, core logic, and test commands.

---

## Architecture Overview

**Stack**
- NestJS (TypeScript)
- PostgreSQL (TypeORM)
- JWT Auth
- RBAC guard

**High‑level flow**
- `AppModule` wires all modules
- `DatabaseModule` bootstraps TypeORM with migrations
- Controllers expose REST endpoints
- Services contain business logic
- Entities map to database tables

**Runtime**
- `main.ts` sets global validation, CORS, compression, helmet
- `.env` controls DB connection + migrations

---

## Core Wiring

**Main App Module**
- `backend/src/app.module.ts`
- Imports all feature modules, database, config

**Database**
- `backend/src/database/database.module.ts`
- `backend/src/database/data-source.ts` for CLI
- Migrations in `backend/src/database/migrations/`

---

## Module Map (What + Where)

### Auth / Users / Tenants
- `auth` — login, JWT guards
- `users` — user CRUD
- `tenants` — tenant creation and listing

### Rooms / Reservations
- `rooms` — room inventory
- `reservations` — booking lifecycle + overlap detection

### Billing / Folio
- `billing` — folios, line items, payments, invoices

### Guests
- `guests` — guest profiles, contact + ID info

### RMS
- `rms` — rates, availability, restrictions

### Housekeeping
- `housekeeping` — tasks + inspections + assignment

### Maintenance
- `maintenance` — work orders

### Inventory
- `inventory` — out‑of‑order room tracking

### POS / F&B
- `bar` — bar menu + orders + folio posting
- `restaurant` — restaurant menu + orders + folio posting

### Front Desk
- `frontdesk` — check‑in/out, guest docs, deposits

### Accounting
- `accounting` — tax rates, ledger entries

### Taxes
- `taxes` — tax rule management

### CRM
- `crm` — loyalty accounts

### Corporate
- `corporate` — corporate accounts

### Procurement
- `procurement` — suppliers + stock items

### HR
- `hr` — staff shifts

### Concierge
- `concierge` — transport requests

### Events
- `events` — event scheduling

### Spa
- `spa` — spa services + appointments

### Reports & Analytics
- `reports` — KPI & revenue reports
- `analytics` — KPI endpoints (wraps reports)

### Notifications
- `notifications` — email/SMS stub logging

### Permissions
- `permissions` — permissions + role mapping

### Channel Manager
- `channel` — integrations + sync logs (stubs)

---

## Business Logic Highlights

**Reservations**
- Overlap detection using date range queries
- Status transitions enforced
- On checkout: auto room night charge + folio close

**Folio / Billing**
- Line item enforcement for GST, payments
- Invoice generation calculates subtotal + tax + total

**POS (Bar/Restaurant)**
- Orders can post to folio (`BAR_CHARGE`, `FNB_CHARGE`)
- Idempotent posting and reversal

**Housekeeping**
- Task workflow + inspection logs

**Frontdesk**
- Check‑in/out changes reservation + room status
- Guest document verification stored
- Deposits tracked

---

## Migrations
- `backend/src/database/migrations/`
- Run with `npm run migration:run`

---

## Test / Run Commands

**Install**
```bash
npm install
```

**Run (dev)**
```bash
npm run start:dev
```

**Run (prod)**
```bash
npm run build
node dist/main.js
```

**Migrations**
```bash
npm run migration:run
npm run migration:revert
```

**Seed**
```bash
npm run seed:all
```

**Lint / Tests**
```bash
npm run lint
npm run test
```

---

## Environment

Required `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=master_db
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true
DB_LOGGING=true
```

---

## Notes
- `DB_SYNCHRONIZE=false` is required (use migrations only).
- Stubs exist for notifications + channel manager.
