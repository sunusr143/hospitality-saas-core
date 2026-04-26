# PMS Flow Analysis & Optimization Guide
**Current Date:** March 29, 2026  
**Status:** Comprehensive Analysis Complete  
**Repository:** feat-full-billing-and--other-modules-with-dynamic-room-charges

---

## 1. CURRENT PMS STATE

### Architecture Overview
The PMS operates as a **13-module, tenant-isolated, event-driven system** with strong separation of concerns:

**Core Modules:**
- **Reservations** → Guest bookings (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT)
- **FrontDesk** → Check-in/check-out operations
- **Guests** → Guest profiles with KYC data
- **Rooms** → Physical room inventory + status management
- **Billing/Folios** → Financial tracking (charges, taxes, payments)
- **Payments** → Payment processing + reconciliation
- **RMS** → Revenue management (rates, availability, restrictions)
- **RatePlans** → Pricing configuration
- **Housekeeping** → Room maintenance tasks
- **Accounting** → Ledger entries
- **AuditLogs** → Operation audit trails
- **Taxes** → Tax rule engine
- **Notifications** → Guest communications

---

## 2. CURRENT RESERVATION FLOW

### Phase 1: Booking (CREATE)
```
POST /reservations
├─ Input: checkInDate, checkOutDate, roomId, guestEmail, guestName
├─ Processing:
│  ├─ Check room availability (date overlap query)
│  ├─ Lookup guest by email (case-insensitive, unique per tenant)
│  └─ Create guest if not exists
├─ Database: Insert Reservation with status=PENDING
└─ Output: Reservation object (awaiting confirmation)
```

**Key Business Rules:**
- Room must be AVAILABLE status
- Email must be unique per tenant
- Reservation indexed by [tenant, room, checkInDate, checkOutDate]

---

### Phase 2: Confirmation
```
PATCH /reservations/:id/status
├─ Input: status=CONFIRMED
├─ Processing: Manual staff approval (no auto-approval currently)
└─ Status: PENDING → CONFIRMED
```

**Current Limitation:**
- ⚠️ No automatic confirmation logic
- Requires manual staff intervention
- No webhook/event trigger on confirmation

---

### Phase 3: Check-In
```
POST /frontdesk/checkin
├─ Input: reservationId
├─ Pre-conditions:
│  ├─ Reservation exists
│  ├─ Status = CONFIRMED
│  └─ Room still AVAILABLE
├─ Processing:
│  ├─ Verify guest documents (optional)
│  ├─ Collect deposit (optional)
│  ├─ Create Folio with status=OPEN
│  ├─ Update Reservation → status=CHECKED_IN
│  └─ Update Room → status=OCCUPIED
├─ Output: Check-in confirmation
└─ Triggers: Housekeeping task NOT auto-created on check-in
```

**Current Issues:**
1. ⚠️ Folio creation timing unclear (manual vs. automatic)
2. ⚠️ No explicit charge line items created at check-in
3. ✓ Document verification available but optional

---

### Phase 4: Stay Period
```
During Stay (CHECKED_IN status)
├─ Add Line Items to Folio:
│  ├─ POST /folios/:folioId/line-items
│  ├─ Types: ROOM_CHARGE, TAX_GST, SERVICE_CHARGE, PAYMENT, ADJUSTMENT, BAR_ORDER, LAUNDRY, etc.
│  ├─ Each includes: description, quantity, unitPrice, totalAmount
│  └─ Unique constraints: [folio, type] for ROOM_CHARGE & TAX_GST (one per type)
└─ Multiple payments can be posted
```

**Line Item Accumulation:**
- Room charges (typically 1 per night)
- Restaurant/Bar charges (multiple possible, if integrated)
- Service charges (resort fees, etc.)
- Taxes (GST/VAT per jurisdiction)
- Adjustments (discounts, complimentary items)

**Current Limitation:**
- ⚠️ No automatic nightly room charge creation during stay
- Must manually add each day's charge
- No scheduler/batch job to auto-charge

---

### Phase 5: Check-Out
```
POST /frontdesk/checkout
├─ Pre-conditions:
│  ├─ Reservation → status=CHECKED_IN
│  └─ Folio → status=OPEN or IN_PROGRESS
├─ Processing Flow:
│  1. Auto Room-Night Charge:
│     ├─ Query RMS rates OR fallback to RatePlan.findLatestActiveForTenant()
│     ├─ Calculate: (checkOut - checkIn) nights × rate
│     ├─ Create line item: ROOM_CHARGE with total amount
│     └─ Add to Folio
│  2. Close Folio:
│     ├─ Change status: OPEN/IN_PROGRESS → CLOSED
│     ├─ Set closedAt timestamp
│     └─ Lock against further modifications
│  3. Update States:
│     ├─ Reservation → status=CHECKED_OUT
│     ├─ Room → status=AVAILABLE
│     └─ Create Housekeeping task: room=OCCUPIED
└─ Output: Checkout confirmation + final bill summary
```

**Current Auto-Charge Logic:**
- Triggered: ON checkout action
- Rate Source: RatePlan.findLatestActiveForTenant() (picks latest ACTIVE plan)
- Calculation: Simple (nights × rate) — no seasonal/dynamic pricing applied at checkout

**Issues:**
1. ⚠️ Rate lookup uses "latest active" (may not match booking date)
2. ⚠️ No dynamic pricing applied from RMS daily rates
3. ⚠️ Single unified charge (not per-night breakdown)
4. ✓ Housekeeping task created (to be verified)

---

### Phase 6: Payment Collection
```
POST /folios/:folioId/payments
├─ Input:
│  ├─ paymentMethod: CASH | CARD | BANK_TRANSFER | CREDIT | OTHER
│  ├─ amount: decimal
│  ├─ idempotency-key: UUID (optional, prevents duplicates)
│  └─ paymentReference: string (unique per folio × type)
├─ Idempotency Check:
│  └─ Unique index: [folio, paymentReference] ensures no double-posting
├─ Processing:
│  ├─ Create FolioLineItem with type=PAYMENT
│  ├─ Amount stored as negative (credit to guest account)
│  ├─ Optional provider integration (Stripe, PayPal, etc.)
│  └─ Mark as unreconciled (pending bank confirmation)
└─ Output: Payment confirmation with reference
```

**Current Capabilities:**
- ✓ Multiple payment methods supported
- ✓ Partial payments allowed (multiple line items)
- ✓ Idempotency via paymentReference

**Limitation:**
- ⚠️ Optional provider integration (may need expansion)

---

### Phase 7: Payment Reconciliation
```
POST /payments/reconcile
├─ Input:
│  ├─ paymentTransactionId
│  └─ providerReference (from bank/payment gateway)
├─ Processing:
│  ├─ Create PaymentReconciliation record
│  ├─ Link to PaymentTransaction
│  ├─ Update status: pending → completed/failed
│  └─ Create Ledger entry (AuditLog + Accounting)
└─ Output: Reconciliation confirmation
```

**Accounting Trail:**
- Payment posted → AuditLog entry
- Reconciliation → Ledger entry (for financial reporting)

---

## 3. DATA ENTITIES & RELATIONSHIPS

### Core Entities

| Entity | Key Fields | Relationships | Constraints |
|--------|-----------|---------------|----|
| **Reservation** | id, checkIn/Out dates, status | → Room, Guest, Tenant | Indexed: [tenant, room, dates] |
| **Room** | roomNumber, type, status | One-to-Many Reservations | Unique: [tenant, roomNumber] |
| **Guest** | email, phone, fullName, KYC | One-to-Many Reservations | Unique: [tenant, email] |
| **Folio** | status, guestNameSnapshot | 1:1 Reservation, One-to-Many LineItems | Unique: [tenant, reservation] |
| **FolioLineItem** | type, amount, description | → Folio, Tenant | Unique: [folio, type] for ROOM_CHARGE/TAX_GST |
| **RatePlan** | basePrice, validFrom/To, status | Many-to-Many Rooms | Status: ACTIVE/ARCHIVED |
| **RMS Rate** | dailyRate, date | → Tenant | Optional override for RatePlan |
| **PaymentTransaction** | provider, status, metadata | → Folio, Tenant | Links to external payment system |
| **HousekeepingTask** | priority, status, dueAt | → Room, User | Auto-created on checkout |

---

## 4. IDENTIFIED ISSUES & BOTTLENECKS

### 🔴 HIGH PRIORITY

#### Issue 1: Lack of Dynamic Pricing at Checkout
**Problem:**
- Checkout auto-charge uses `findLatestActiveForTenant()` — picks **one active rate** regardless of booking dates
- No per-day rate variation applied
- Example: RMS set $100/night Jan-Mar, $150/night Apr-Jun, but checkout applies same rate

**Impact:**
- Revenue loss if rates are seasonal/dynamic
- Billing doesn't match rates offered during booking

**Solution:** (See Optimizations section)

---

#### Issue 2: No Automatic Daily Charge Accumulation
**Problem:**
- Room charges only applied at checkout
- No line items created per-night during stay
- Folio shows zero balance until guest checks out

**Impact:**
- Guest sees no interim billing statements
- Staff can't monitor accrual during multi-day stays
- No daily reconciliation available

**Solution:** Implement scheduled nightly charge job

---

#### Issue 3: Manual Confirmation Bottleneck
**Problem:**
- All reservations require manual staff confirmation
- No auto-confirmation for pre-paid or trusted sources
- No webhook on confirmation event

**Impact:**
- Operational overhead
- Delays in reservation processing
- No integration point for OTA/channel managers

**Solution:** Add conditional auto-confirmation rules

---

#### Issue 4: Folio Creation Timing Ambiguity
**Problem:**
- Unclear if folio created at: booking, confirmation, or check-in
- No explicit endpoint to manage folio lifecycle
- Manual folio creation exists but restricted to ADMIN

**Impact:**
- Confusion for integrating systems
- Potential for missing folios
- Can't plan billing ahead of check-in

**Solution:** Explicit folio creation at confirmation (optional, see optimizations)

---

### 🟡 MEDIUM PRIORITY

#### Issue 5: No Multi-Currency/Exchange Rate Handling
**Problem:**
- Folio has `currency` field, but no exchange rate logic
- International guests charged in hotel's primary currency
- No rate conversion at post-checkout

**Impact:**
- Incorrect billing for international guests
- No support for multi-currency display

**Solution:** Add currency conversion service + rates table

---

#### Issue 6: Tax Calculation Timing
**Problem:**
- Tax is added as line item (TAX_GST)
- Unique constraint: only 1 TAX_GST per folio (may not support multiple tax jurisdictions)
- No breakdown by tax type (GST vs. VAT vs. local taxes)

**Impact:**
- Limited to single tax rate per folio
- Complex jurisdictions unsupported

**Solution:** Change constraint to allow [folio, taxType, taxRate] combination

---

#### Issue 7: Room Move Operations
**Problem:**
- `POST /front-desk/room-move` exists but underspecified
- No billing adjustment for room moves
- Room status updates unclear

**Impact:**
- Guest moves (upgrades/downgrades) don't adjust pricing
- Final bill may not reflect room change

**Solution:** Implement room change billing logic

---

#### Issue 8: No Pre-Arrival Operations
**Problem:**
- No deposit pre-charge before arrival
- No rate lock confirmation
- No pre-authorization for card

**Impact:**
- Higher chargeback risk
- No payment security before arrival
- Guests can modify booking without deposit

**Solution:** Add pre-arrival billing phase

---

#### Issue 9: Weak Availability Checking
**Problem:**
- Availability checked via `SELECT WHERE checkInDate < :checkout AND checkOutDate > :checkin`
- No account for room status changes during booking window
- No reservation hold expiry

**Impact:**
- Race condition if rooms booked simultaneously
- Booking window not enforced

**Solution:** Add reservation holds + expiry

---

### 🟢 LOW PRIORITY (Quality/Performance)

#### Issue 10: No Rate Caching
**Problem:**
- RatePlan lookup runs on every checkout
- RMS rates queried from DB without caching

**Impact:**
- DB load increases during peak operations
- Slow checkout if DB is stressed

**Solution:** Implement Redis caching with TTL

---

#### Issue 11: Missing Partial Checkout
**Problem:**
- Checkout is all-or-nothing
- Can't handle early departure billing adjustments
- No mid-stay modifications

**Impact:**
- Inflexible for operational edge cases

**Solution:** Add early checkout adjustment logic

---

#### Issue 12: No Integration with Other Modules
**Problem:**
- Bar/Restaurant charges must be manually added
- Spa charges not integrated
- Laundry service billing manual

**Impact:**
- Extra staff effort to aggregate all charges
- Charges can be forgotten

**Solution:** Add event-driven charge posting from other modules

---

---

## 5. OPTIMIZATION STRATEGY

### Tier 1: Critical Fixes (Implement Immediately)

#### 1.1 Fix Dynamic Pricing at Checkout
**Change:** Use per-date RMS rates instead of single RatePlan rate

```typescript
// CURRENT (❌ Wrong)
const rate = await this.ratePlansService.findLatestActiveForTenant(tenantId);
const charge = (nights) * rate.basePrice;

// OPTIMIZED (✓ Correct)
const dailyRates = await this.rmsService.findRatesByDateRange(
  tenantId, roomId, checkInDate, checkOutDate
);
const charge = dailyRates.reduce((sum, day) => sum + day.rate, 0);
```

**Benefits:**
- ✓ Accurate billing matching booking date rates
- ✓ Support for seasonal pricing
- ✓ Revenue integrity

**Implementation:**
- Modify `foliosService.addRoomNightCharge()`
- Query RMS daily rates first
- Fallback to RatePlan if RMS rates not found
- Create per-day line items (or single aggregated item with breakdown)

**Effort:** 3-4 hours

---

#### 1.2 Implement Nightly Charge Accumulation
**Change:** Create scheduled job to post nightly charges during stay

```typescript
// New Scheduled Job (runs daily at 2 AM)
async chargeNightlyRoomCharges() {
  const activeReservations = await this.getCheckedInReservations();
  for (const reservation of activeReservations) {
    const folio = await this.foliosService.getFolioForReservation(reservation.id);
    const rate = await this.rmsService.getDailyRate(
      reservation.room.id, 
      today
    );
    await this.foliosService.addLineItem(folio.id, {
      type: 'ROOM_CHARGE',
      description: `Room Charge - ${today}`,
      amount: rate,
      dayOf: today
    });
  }
}
```

**Benefits:**
- ✓ Guest sees interim charges
- ✓ Daily reconciliation possible
- ✓ Accurate multi-night billing

**Implementation:**
- Use NestJS `@Cron()` decorator
- Create separate line item per day (change unique constraint to [folio, type, dayOf])
- Update checkout to not double-charge

**Effort:** 4-5 hours

---

#### 1.3 Add Conditional Auto-Confirmation
**Change:** Allow auto-confirm certain reservation types

```typescript
// Pre-paid or trusted OTA bookings
async confirmReservation(reservationId: string) {
  const reservation = await this.getReservation(reservationId);
  
  if (reservation.source === 'DIRECT_PAY' || 
      reservation.source === 'TRUSTED_OTA') {
    // Auto-confirm
    await this.updateStatus(CONFIRMED);
    await this.eventEmitter.emit('reservation.confirmed', reservation);
  } else {
    // Manual confirmation required
    await this.changeStatus(PENDING_CONFIRMATION);
  }
}
```

**Benefits:**
- ✓ Reduce staff burden
- ✓ Faster OTA integrations
- ✓ Event-driven architecture

**Implementation:**
- Add `source` field to Reservation
- Add confirmation config (auto-confirm list)
- Emit `reservation.confirmed` event
- Listeners: start check-in prep, notify housekeeping

**Effort:** 2-3 hours

---

#### 1.4 Explicitize Folio Creation
**Change:** Create folio at confirmation, not check-in

```typescript
// When reservation confirmed:
async onReservationConfirmed(reservation: Reservation) {
  const folio = await this.foliosService.createFolio({
    reservationId: reservation.id,
    status: 'PREPARED',  // New status: not yet OPEN
    guestNameSnapshot: reservation.guestName,
    currency: 'USD'  // From hotel config
  });
  
  // Pre-calculate and show estimated charges
  const estimatedCharges = await this.estimateCharges(reservation);
  await this.notificationService.sendEstimate(folio, estimatedCharges);
}
```

**Benefits:**
- ✓ Clear folio lifecycle
- ✓ Guest sees estimate at confirmation
- ✓ Integrate with payment pre-auth

**Folio Status Lifecycle:**
```
PREPARED (confirmation) 
  → OPEN (check-in) 
  → IN_PROGRESS (during stay) 
  → CLOSED (checkout)
```

**Effort:** 3-4 hours

---

### Tier 2: Feature Enhancements (1-2 week sprint)

#### 2.1 Multi-Currency Support
- Add currency conversion service
- Store exchange rates with daily snapshot
- Convert charges to hotel currency at folio creation
- Display both guest currency and hotel currency

**Effort:** 6-8 hours

---

#### 2.2 Multi-Tax Support
**Change:** Allow multiple tax types per folio

```typescript
// Current (wrong):
// Unique: [folio, type=TAX_GST]  // Only 1 tax allowed

// Optimized:
// Unique: [folio, taxType, taxRate]  // Multiple tax lines
// Types: TAX_GST, TAX_VAT, TAX_LOCAL, TAX_SERVICE

const taxes = [
  { type: 'TAX_GST', rate: 0.07, amount: 35.00 },  // India GST
  { type: 'TAX_LOCAL', rate: 0.02, amount: 10.00 } // City tax
]
```

**Effort:** 4-5 hours

---

#### 2.3 Room Move with Billing
- Track room changes per reservation
- Create adjustment line items
- Recalculate charges based on new room rate
- Update housekeeping tasks

**Effort:** 5-6 hours

---

#### 2.4 Event-Driven Charge Integration
- Allow other modules (Restaurant, Spa, Laundry) to emit `charge.created` events
- Subscribe in FoliosService
- Auto-add line items with source module reference

**Effort:** 4-5 hours

---

### Tier 3: Advanced Features (Strategic)

#### 3.1 Pre-Arrival Billing Phase
- Pre-charge for advance bookings
- Rate lock confirmation
- Payment pre-authorization
- Deposit collection ahead of arrival

**Effort:** 10-12 hours

---

#### 3.2 Rate Caching & Performance
- Redis caching layer for RatePlans + RMS rates
- 24-hour TTL with invalidation on updates
- Query optimization (N+1 query elimination)

**Effort:** 6-8 hours

---

#### 3.3 Partial Checkout & Billing Adjustments
- Support early departure
- Mid-stay rate changes
- Overbooking recovery (move guest + price adjustment)
- Proration logic

**Effort:** 8-10 hours

---

#### 3.4 Advanced Availability Management
- Reservation holds with expiry
- Real-time race condition handling (pessimistic locking)
- Overbooking prevention
- Channel inventory sync

**Effort:** 12-15 hours

---

---

## 6. IMPLEMENTATION PRIORITY MATRIX

| Feature | Impact | Effort | Priority | Timeline |
|---------|--------|--------|----------|----------|
| Fix Dynamic Pricing | High | Low | **1** | Day 1 |
| Nightly Charge Job | High | Medium | **2** | Day 2-3 |
| Auto-Confirmation | Medium | Low | **3** | Day 3 |
| Explicit Folio Creation | Medium | Low | **4** | Day 4 |
| Multi-Tax Support | Medium | Medium | **5** | Week 2 |
| Event-Driven Integration | Medium | Medium | **6** | Week 2 |
| Multi-Currency | Low | Medium | **7** | Week 3 |
| Room Move Billing | Medium | Medium | **8** | Week 3 |
| Pre-Arrival Billing | Low | High | **9** | Month 2 |
| Rate Caching | Low | Medium | **10** | Month 2 |

---

## 7. DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────┐
│ FIX 1: Dynamic Pricing                      │
│ (Must complete first - affects all billing) │
└────────────────────────┬────────────────────┘
                         │
        ┌────────────────┴─────────────────┐
        ↓                                  ↓
┌─────────────────┐          ┌──────────────────────┐
│ FIX 2: Nightly  │          │ FIX 3: Auto-Confirm  │
│ Charges (depends│          │ (Independent)        │
│ on Fix 1)       │          └──────────────────────┘
└────────┬────────┘                      ↓
         │                    ┌──────────────────────┐
         │                    │ FIX 4: Folio Create  │
         │                    │ (Depends on Fix 3)   │
         │                    └────────┬─────────────┘
         │                             │
         └────────────┬────────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ TIER 2: Enhancements        │
        │ (Can run in parallel)       │
        │ - Multi-Tax, Currency       │
        │ - Event-Driven Integration  │
        │ - Room Move Billing         │
        └─────────────────────────────┘
                      │
                      ↓
        ┌─────────────────────────────┐
        │ TIER 3: Advanced Features   │
        │ (Month 2 onwards)           │
        └─────────────────────────────┘
```

---

## 8. ARCHITECTURAL RECOMMENDATIONS

### 8.1 Event-Driven Architecture
Implement event emitters for key PMS transitions:

```typescript
// Emit events at critical points
@EventEmitter()
class ReservationService {
  async createReservation(...) {
    const res = new Reservation(...);
    this.eventEmitter.emit('reservation.created', res);
    return res;
  }
  
  async confirmReservation(id: string) {
    const res = await this.update(id, { status: CONFIRMED });
    this.eventEmitter.emit('reservation.confirmed', res);
    return res;
  }
  
  async checkIn(id: string) {
    const res = await this.update(id, { status: CHECKED_IN });
    this.eventEmitter.emit('guest.arrived', res);
    return res;
  }
}

// Other modules listen
@Injectable()
class HousekeepingListener {
  @OnEvent('guest.arrived')
  async onGuestArrived(reservation: Reservation) {
    await this.createWelcomeTask(reservation.room);
  }
}

@Injectable()
class BillingListener {
  @OnEvent('reservation.confirmed')
  async onConfirmed(reservation: Reservation) {
    const folio = await this.createFolio(reservation);
    await this.notifyEstimate(folio);
  }
}
```

**Benefits:**
- ✓ Loose coupling between modules
- ✓ Easy to add new listeners (e.g., notifications, analytics)
- ✓ Testable in isolation

---

### 8.2 Service Segregation
Split `FoliosService` into specialized services:

```typescript
// folios.service.ts — Core folio management
FoliosService {
  createFolio(reservationId)
  closeFolio(folioId)
  getFolio(folioId)
}

// folio-charges.service.ts — Charge posting
FolioChargesService {
  addLineItem(folioId, type, amount)
  addRoomCharge(folioId, nightCharge)
  applyTax(folioId, rate, amount)
}

// folio-payments.service.ts — Payment posting
FolioPaymentsService {
  postPayment(folioId, method, amount)
  reversePayment(folioId, paymentId)
  getBalance(folioId)
}

// folio-summary.service.ts — Reporting
FolioSummaryService {
  getStatement(folioId)
  calculateTotalDue(folioId)
  getDailyBreakdown(folioId)
}
```

**Benefits:**
- ✓ Single responsibility
- ✓ Easier to test each concern
- ✓ Better code organization

---

### 8.3 Add Repository Pattern for Complex Queries
Create specialized repositories:

```typescript
@Injectable()
class ReservationRepository {
  findByRoomAndDateRange(roomId, checkIn, checkOut) {
    // Complex overlapping date query
  }
  
  findActive(tenantId) {
    // CHECKED_IN + PENDING_CONFIRMATION
  }
  
  findOverdue(tenantId) {
    // Check-out date passed, still CHECKED_IN
  }
}

@Injectable()
class FolioRepository {
  findByReservation(reservationId) {
    // Including line items with one query
  }
  
  findUnpaid(tenantId) {
    // Status = CLOSED and balance > 0
  }
}
```

---

### 8.4 Billing State Machine
Implement explicit folio state transitions:

```
        PREPARED (created at confirmation)
            ↓
          OPEN (guest checks in)
            ↓
      IN_PROGRESS (stays, charges accumulate)
            ↓
         CLOSED (checked out, no changes allowed)
         
Invariants:
- Can only add charges to OPEN/IN_PROGRESS
- Can only post payments to OPEN/IN_PROGRESS/CLOSED
- Can only reverse payments if CLOSED and within 30 days
```

---

## 9. TESTING RECOMMENDATIONS

### Unit Tests (Per Service)
- RatePlan precedence (latest active)
- Nightly charge calculation
- Tax application
- Payment idempotency
- Folio balance calculation

### Integration Tests (Cross-Module*
- Reservation → Folio → Payment flow
- Rate pricing for 3-day stay
- Tax on total charges
- Room move with billing
- Early departure adjustment

### E2E Tests (Customer Journeys)
- Guest books → Confirms → Checks in → Charges accrue → Checks out → Pays
- Multi-night stay with rate changes
- International guest with currency conversion
- VIP guest with discount adjustment

---

## 10. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All Tier 1 fixes completed + tested
- [ ] Migration created for folio status changes
- [ ] RMS rate fallback logic verified
- [ ] Nightly job scheduled + tested
- [ ] Event listeners subscribed
- [ ] Database indexes optimized

### Deployment
- [ ] Run migrations (backward compatible)
- [ ] Deploy code with feature flags
- [ ] Enable nightly job on secondary DB
- [ ] Monitor folio creation time
- [ ] Verify charge calculations

### Post-Deployment
- [ ] Monitor checkout time (should not increase)
- [ ] Verify folio balance accuracy
- [ ] Check nightly charges posting correctly
- [ ] Validate payment reconciliation
- [ ] Gather feedback; iterate

---

## 11. METRICS & MONITORING

### Key PDM (Product Delivery Metrics)
- **Billing Accuracy Rate:** (Folios reconciled = Total folios) × 100
- **Checkout Time:** avg seconds for checkout process
- **Folio Creation Lag:** elapsed time from confirmation to folio ready
- **Charge Coverage:** (Folios with room charges) / (Folios checked out)

### Alarms
- ⚠️ Nightly job failed (missing charges)
- ⚠️ Checkout time > 10 seconds
- ⚠️ Rate lookup fails (fallback used)
- ⚠️ Folio reconciliation discrepancy > 1%

---

## 12. SUMMARY

**Current State:**
- ✓ Functional PMS with 13-module architecture
- ⚠️ Critical billing gaps (dynamic pricing, daily charges)
- ⚠️ Operational bottlenecks (manual confirmation, unclear folio lifecycle)

**Recommended Action:**
1. **Immediately fix:** Dynamic pricing, nightly charges, folio creation, auto-confirmation
2. **Short-term enhance:** Tax/currency support, event-driven integration
3. **Long-term scale:** Pre-arrival billing, advanced availability, caching

**Estimated Effort:**
- Tier 1: 10-15 hours (1-2 days)
- Tier 2: 25-30 hours (3-4 days)
- Tier 3: 40-50 hours (5-7 days)
- **Total:** 75-95 hours (~2 weeks for a small team)

**ROI:**
- ✓ Eliminate revenue leakage (dynamic pricing)
- ✓ Reduce operational overhead (auto-confirmation, nightly charges)
- ✓ Improve guest experience (interim billing, accurate charges)
- ✓ Scale international business (currency, multi-tax)
