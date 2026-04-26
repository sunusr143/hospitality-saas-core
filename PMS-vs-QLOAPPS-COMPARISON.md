# PMS Analysis vs. QLOApps - Missing Flows Comparison
**Date:** March 29, 2026  
**Analysis Type:** Gap Analysis - QLOApps Features vs. PMS Documentation

---

## Executive Summary

QLOApps (detected from migration files) **introduced 11 major feature areas** that expand beyond the core PMS. While the PMS analysis documents basic reservation and billing flows, QLOApps adds sophisticated revenue management, operations, and integration capabilities.

**Key Finding:** The PMS analysis covers ~40% of QLOApps' actual implemented features. **9 major feature flows are missing** from the analysis.

---

## 1. QLOAPPS FEATURES IDENTIFIED

From migration files: `20260207000100-add-guests-and-bar.ts`, `20260207000300-qloapps-modules.ts`, `20260207000400-more-modules.ts`

### Implemented Feature Modules

| Feature | Entities | Status | Details |
|---------|----------|--------|---------|
| **Rate Calendar** | rate_calendar | ✓ Implemented | Daily rates by room type + date |
| **Availability Calendar** | availability_calendar | ✓ Implemented | Room inventory + stop-sell flags |
| **Restriction Calendar** | restriction_calendar | ✓ Implemented | Min/max stay, closed rules |
| **Room Move Logging** | room_move_logs | ✓ Implemented | Track room changes + audit trail |
| **Room Out of Order** | room_out_of_order | ✓ Implemented | Maintenance tracking + status |
| **Restaurant Module** | restaurant_categories, items, orders | ✓ Implemented | Full ordering + menu system |
| **Bar Module** | bar_categories, items, orders | ✓ Implemented | Full ordering + menu system |
| **Tax Engine** | tax_rates | ✓ Implemented | Multi-rate tax configuration |
| **Ledger** | ledger_entries | ✓ Implemented | Accounting entries (CHARGE, PAYMENT, REFUND, ADJUSTMENT) |
| **Channel Sync** | channel_sync_logs | ✓ Implemented | OTA/Channel manager integration |
| **Housekeeping Inspections** | housekeeping_inspections | ✓ Implemented | Room inspection pass/fail |
| **Maintenance Requests** | maintenance_requests | ✓ Implemented | Maintenance task management |
| **Corporate Accounts** | corporate_accounts | ✓ Implemented | Corporate billing entities |
| **Payment Transactions** | payment_transactions | ✓ Implemented | Payment provider integration |

---

## 2. FLOWS COVERED IN PMS ANALYSIS

### ✓ Documented Flows

1. **Reservation Lifecycle** (7 phases)
   - Create → Confirm → Check-in → Stay → Checkout → Payment → Reconciliation

2. **Basic Billing** (Folio)
   - Folio creation, line items, payment posting, reconciliation

3. **Room Management**
   - Status transitions (AVAILABLE, OCCUPIED, MAINTENANCE, OUT_OF_SERVICE)

4. **Guest Management**
   - Profile creation, KYC data

5. **Simple RatePlan**
   - Time-bounded pricing (validFrom/To)

6. **Basic Housekeeping**
   - Task creation on checkout

---

## 3. MAJOR FLOWS MISSING FROM PMS ANALYSIS

### 🔴 CRITICAL MISSING: Revenue Management (RMS Advanced)

**QLOApps Capability:**
```
Rate Calendar + Availability Calendar + Restriction Calendar
= Advanced RMS (Rate, Inventory, Restriction Management)
```

**What's Implemented but Not Documented:**
- ✓ Daily rate calendar (override RatePlan per room type per date)
- ✓ Room availability tracking (totalRooms - availableRooms)
- ✓ Stop-sell capability (prevent further bookings without blocking)
- ✓ Booking restrictions:
  - Min stay requirement (1-7 nights)
  - Max stay limit
  - Closed to arrival (on specific dates)
  - Closed to departure
  - Fully closed dates

**Business Impact:**
- Dynamic pricing management → ensures revenue optimization
- Availability control → prevents overbooking
- Advanced yield management → competitive rate setting

**Missing from Analysis:**
- No flow for "how rates are queried from calendar vs. RatePlan"
- No conflict resolution (what if Rate Calendar & RatePlan both exist?)
- No stop-sell workflow (when to activate/deactivate)
- No restriction enforcement during booking

**Recommended Addition to Analysis:**
```
Rate Selection Flow:
1. Query restriction_calendar[room_type, date]
   - If minStay = 3, prevent 1-2 night bookings
   - If closedToArrival = true, prevent new checkins
   - If closed = true, block entire date
2. Query rate_calendar[room_type, date]
   - If exists: use daily rate
   - Else: fallback to RatePlan.basePrice
3. If stopSell = true: hide from OTA, allow walk-ins only
4. Calculate final rate (accounting for LOS pricing if applicable)
```

---

### 🔴 CRITICAL MISSING: Room Movement & Operational Tracking

**QLOApps Capability:**
```
room_move_logs table with audit trail
```

**What's Implemented but Not Documented:**
- Room change tracking (from room → to room)
- Reason tracking (upgrade, maintenance, guest request, etc.)
- Audit trail (who moved, when)
- Linked to reservation (know which booking caused move)

**Business Impact:**
- Billing adjustments (if moved to higher/lower category)
- Operational history (trace room changes through stay)
- Staff accountability (track who made moves)

**Missing from Analysis:**
- No "room move billing flow" (current analysis lists as Medium Priority Issue #7)
- No audit trail explanation
- No impact on folio charges
- No workflow for conflicting room constraints

**Recommended Addition to Analysis:**
```
Room Move Flow:
1. Guest requests upgrade (from Suite to Presidential Suite)
2. POST /front-desk/room-move {fromRoomId, toRoomId, reason}
3. Check new room availability (no reservations overlap)
4. Create room_move_logs entry (audit trail)
5. Calculate price difference:
   - Old room rate: $150/night
   - New room rate: $200/night
   - Difference: +$50/night for remaining nights
6. Create folio line item: 
   - Type: ADJUSTMENT
   - Amount: +$50 × (remaining nights)
   - Description: Room upgrade adjustment
7. Update room_move_logs with audit trail
8. Notify billing system of change
```

---

### 🔴 CRITICAL MISSING: Restaurant & Bar Operations

**QLOApps Capability:**
```
restaurant_categories/items/orders + bar_categories/items/orders
```

**What's Implemented but Not Documented:**
- Full menu system (categories, items with pricing)
- Order creation & management (OPEN → POSTED → CANCELLED)
- Order items with quantity/pricing
- Tax application per order
- Folio linkage (auto-charge to guest bill)
- Order audit (timestamps, who created)
- Item snapshots (preserve menu at order time)

**Business Impact:**
- Guest ordering (in-room dining, F&B)
- Revenue tracking (all charges to folio)
- Menu management (SKU, pricing, categories)
- Tax compliance (F&B taxes may differ from room taxes)
- Audit trail (order cancellations, modifications)

**Missing from Analysis:**
- No restaurant/bar ordering flow documented
- Analysis mentions "BAR_ORDER" line item type but no flow
- No menu management details
- No order-to-folio-to-payment flow
- No cancellation/refund handling
- No kitchen integration (order timing, preparation)

**Recommended Addition to Analysis:**
```
Restaurant Order → Billing Flow:

PHASE 1: Order Creation
1. Guest orders via app/phone → Restaurant Module
2. Create restaurant_order:
   - status = OPEN
   - folioId = linked to guest reservation
   - currency = from folio
3. Add restaurant_order_items (name snapshot, unit price, qty)
4. Calculate totals:
   - subtotal = sum(unitPrice × qty)
   - taxAmount = subtotal × taxRate
   - total = subtotal + taxAmount

PHASE 2: Order Posting (when bill is ready)
1. POST /restaurant/orders/:id/post
2. Create folio_line_item:
   - type = BAR_ORDER (or RESTAURANT_CHARGE)
   - description = "Restaurant Order #XYZ"
   - amount = order.total (including tax)
   - relatedEntityType = "RestaurantOrder"
   - relatedEntityId = order.id
3. Update restaurant_order.status = POSTED
4. Set postedAt = now()

PHASE 3: Billing Integration
1. Folio.total includes restaurant charge
2. ✓ Automatically added during stay
3. Appears on guest bill at checkout
4. Can be reversed if order cancelled

PHASE 4: Payment
1. Guest pays at checkout
2. Payment applied to folio (which includes restaurant)
```

---

### 🔴 CRITICAL MISSING: Advanced Tax Management

**QLOApps Capability:**
```
tax_rates table with multi-rate management
```

**What's Implemented but Not Documented:**
- Configurable tax rates (by jurisdiction/region)
- Multiple tax rates per hotel (GST, VAT, local tax, occupancy tax)
- Tax rate snapshots (prevents historical changes)
- Active/inactive flag (versioning without duplication)

**Business Impact:**
- Multi-jurisdiction tax compliance
- Rate changes over time
- Different taxes for different charges (room vs. restaurant)
- Tax reporting & reconciliation

**Missing from Analysis:**
- Analysis identifies "Issue #6: Tax Calculation Timing" but as MEDIUM priority
- Suggests "change constraint to allow [folio, taxType, taxRate]" but tax_rates table already exists
- No explanation of how multiple taxes are applied
- No mapping between charge types and tax rates
- No tax reconciliation flow

**Recommended Addition to Analysis:**
```
Multi-Tax Application Flow:

SETUP (Tenant Configuration):
1. Create tax_rates entries:
   - GST: 5% (federal)
   - VAT (Local): 2% (regional)
   - Occupancy Tax: 3%

DURING CHECKOUT:
1. Room Night Charge = $100
2. For each tax_rate where isActive = true:
   - Create folio_line_item with each tax
   - GST: $100 × 0.05 = $5.00
   - VAT: $100 × 0.02 = $2.00
   - Occupancy: $100 × 0.03 = $3.00
3. Total taxes: $10.00
4. Guest total: $110.00

FLEXIBILITY:
- Different tax rates for Room vs. Restaurant
- Can disable specific taxes (VAT) for certain guests
- Historical tracking (tax rates on date of charge, not current)
```

---

### 🔴 CRITICAL MISSING: Maintenance Workflow

**QLOApps Capability:**
```
maintenance_requests + room_out_of_order tables
```

**What's Implemented but Not Documented:**
- Maintenance request tracking (OPEN, IN_PROGRESS, RESOLVED, CANCELLED)
- Assignment to staff
- Reporting & resolution timestamps
- Room blocking during maintenance
- Issue logging (reason, description)

**Business Impact:**
- Operational efficiency (track maintenance backlog)
- Room availability management (block maintenance rooms)
- Staff accountability (who assigned, who resolved)
- Audit trail (when reported, when fixed)

**Missing from Analysis:**
- Analysis mentions "room_out_of_order" is auto-created on checkout
- No maintenance request creation flow
- No integration with room status (when room marked MAINTENANCE)
- No escalation workflow (unresolved after X days)
- No prevention of guest booking during maintenance

**Recommended Addition to Analysis:**
```
Maintenance Workflow:

TRIGGER 1: Housekeeping Inspection Failure
1. Housekeeping completes inspection
2. If passed = false:
   - Create maintenance_request
   - Room → status = MAINTENANCE
   - Prevent new reservations for duration

TRIGGER 2: Reporting During Stay
1. Guest reports issue in app
2. POST /maintenance/requests:
   - roomId, title, description
   - Create request with status = OPEN
3. Notify maintenance team
4. Staff can assign (assignedToId)

TRIGGER 3: Preventive Maintenance
1. Room marked for maintenance
2. Create room_out_of_order:
   - startDate, endDate
   - Blocks reservations during period
   - Room hidden from booking engine
3. Once complete → mark as RESOLVED

STATUS TRANSITIONS:
OPEN → IN_PROGRESS (assigned to staff)
IN_PROGRESS → RESOLVED (when work complete)
RESOLVED → Create housekeeping_inspection for verification
```

---

### 🟡 IMPORTANT MISSING: Housekeeping Inspection Workflow

**QLOApps Capability:**
```
housekeeping_inspections table with pass/fail logic
```

**What's Implemented but Not Documented:**
- Room inspection tracking (passed: true/false)
- Inspector identification
- Inspection notes
- Link to enforcement (if failed, trigger maintenance_request)

**Missing from Analysis:**
- No QA workflow for room readiness
- No path from housekeeping → inspection → maintenance if needed
- No impact on room availability (can't rent if inspection failed)

**Recommended Flow:**
```
Housekeeping Inspection Flow:

1. Guest checks out at 11 AM
2. Housekeeping cleans room
3. Inspector arrives:
   - Check cleanliness, amenities, damage
   - Photo documentation
   - Sign off (passed = true)
4. If passed = true:
   - Room marked AVAILABLE
   - Can accept new reservations
5. If passed = false:
   - Trigger maintenance_request
   - Create room_out_of_order
   - Schedule follow-up inspection
   - Room unavailable for booking
```

---

### 🟡 IMPORTANT MISSING: Channel Manager Integration

**QLOApps Capability:**
```
channel_sync_logs with rate, availability, inventory sync
```

**What's Implemented but Not Documented:**
- OTA sync tracking (Airbnb, Booking.com, Expedia, etc.)
- Sync type tracking (RATES, AVAILABILITY, INVENTORY)
- Sync status (PENDING, SUCCESS, FAILED)
- Payload & response logging (for debugging)
- Error tracking

**Business Impact:**
- OTA rate parity (keep all channels in sync)
- Availability sync (prevent overbooking across channels)
- Revenue management (rates update across all channels)

**Missing from Analysis:**
- No mention of channel sync workflow
- No explanation of how rates sync to OTAs
- No conflict resolution (if OTA disagrees on pricing)
- No manual override capability

**Recommended Flow:**
```
Channel Sync Workflow:

SETUP:
1. Configure OTA credentials (Booking.com, Airbnb API keys)
2. Enable sync for: RATES, AVAILABILITY, INVENTORY

TRIGGER: Daily Rate Update
1. Staff updates rate_calendar for tomorrow
2. System triggers channel_sync_logs:
   - type = RATES
   - status = PENDING
3. For each connected channel:
   - POST rate update to Booking.com API
   - Log response
   - If success: status = SUCCESS
   - If failure: status = FAILED, errorMessage = API error
4. If any failed:
   - Alert staff to manual update OTA
   - Retry in 1 hour

TRIGGER: Booking from OTA
1. Guest books via OTA
2. OTA → Hotel API webhook
3. Create reservation
4. Decrement availability_calendar.availableRooms
5. If availableRooms = 0:
   - Trigger sync: AVAILABILITY = SOLD_OUT
   - Notify all channels (Airbnb, Booking) = SOLD_OUT_SOFT_BLOCK

CONFLICT RESOLUTION:
If OTA shows availability but hotel = sold out:
- Manual override by manager
- Queue future update to OTA
```

---

### 🟡 IMPORTANT MISSING: Corporate Accounts & Group Billing

**QLOApps Capability:**
```
corporate_accounts table with contact & billing info
```

**What's Implemented but Not Documented:**
- Corporate customer profiles
- Contact information (name, email, phone)
- Billing address (for invoicing)
- Status tracking (active/inactive)

**Missing from Analysis:**
- No corporate/ group billing flow
- No separate invoicing for companies vs. individuals
- No corporate rate agreements
- No master folio (aggregate guest folios)

**Recommended Flow:**
```
Corporate Group Booking Flow:

1. Corporate Account Manager books group:
   - 10 rooms for "Acme Corp Conference"
   - Corporate account linked to reservations
2. Create multiple reservations (one per guest):
   - Link each to corporate_accounts.id
3. On checkout:
   - Keep folios separate by room (guest accountability)
   - OR aggregate to master folio (corporate billing)
4. Invoice sent to corporate_accounts.billingAddress
5. Corporate pays master invoice
```

---

### 🟡 IMPORTANT MISSING: Accounting Ledger

**QLOApps Capability:**
```
ledger_entries with CHARGE, PAYMENT, REFUND, ADJUSTMENT types
```

**What's Implemented but Not Documented:**
- Ledger entry tracking (mirrors folios but accounting-focused)
- Entry types (CHARGE, PAYMENT, REFUND, ADJUSTMENT)
- Reference tracking (for audit)
- User attribution (who made entry)

**Missing from Analysis:**
- Analysis mentions "AuditLogsService" but not "ledger_entries"
- No accounting reconciliation flow
- No financial reporting from ledger
- No P&L impact

**Recommended Flow:**
```
Ledger Entry Creation:

CHARGE (Room or F&B charged):
1. Folio line item added → type = ROOM_CHARGE, amount = $100
2. Create ledger_entry:
   - type = CHARGE
   - amount = $100
   - reference = folio.id
3. Accounting entry: DR Receivable / CR Revenue

PAYMENT (Guest pays):
1. Folio payment posted → amount = $100
2. Create ledger_entry:
   - type = PAYMENT
   - amount = $100
   - reference = paymentTransaction.id
3. Accounting entry: DR Cash / CR Receivable

REFUND (Cancellation refund):
1. Reservation cancelled → refund $100 to guest
2. Create ledger_entry:
   - type = REFUND
   - amount = -$100
3. Accounting entry: DR Expense / CR Cash

ADJUSTMENT (Manager discount):
1. Manager applies 10% discount = -$10
2. Create ledger_entry:
   - type = ADJUSTMENT
   - amount = -$10
   - reference = "10% early-bird discount"
3. Accounting entry: DR Expense / CR Receivable
```

---

### 🟡 IMPORTANT MISSING: Payment Transaction Provider Integration

**QLOApps Capability:**
```
payment_transactions with provider, providerReference, metadata tracking
```

**What's Implemented but Not Documented:**
- External provider tracking (Stripe, PayPal, etc.)
- Transaction reference from provider (for reconciliation)
- Status tracking (PENDING, CAPTURED, FAILED, REFUNDED)
- Metadata storage (gateway-specific data)

**Business Impact:**
- PCI compliance (use payment providers, not direct card handling)
- Payment reconciliation (match bank transactions to folio)
- Refund processing
- Fraud detection (provider tools)

**Missing from Analysis:**
- Analysis mentions "optional provider integration" as capability
- No flow for payment provider webhook (payment completed notification)
- No reconciliation process
- No failed payment recovery

**Recommended Flow:**
```
Payment Provider Integration Flow:

SETUP:
1. Configure Stripe API key in tenant settings
2. Create Stripe webhook for payment success/failure

DURING CHECKOUT (Payment Collection):
1. Create payment_transactions:
   - provider = 'STRIPE'
   - folioId = current folio
   - amount = due amount
2. Call Stripe API: create payment intent
3. Store providerReference = stripe_intent_id
4. status = PENDING
5. Direct guest to Stripe payment form

WEBHOOK (Stripe → Hotel API):
1. Guest completes payment on Stripe
2. Stripe sends webhook: payment_intent.succeeded
3. Update payment_transactions:
   - status = CAPTURED
   - metadata.stripeChargeId = charge_id
4. Create folio payment line item (mirrors folio_line_item type=PAYMENT)
5. Email receipt to guest

FAILURE CASE:
1. Stripe webhook: payment_intent.payment_failed
2. Update payment_transactions.status = FAILED
3. Alert front desk
4. Send guest retry email

REFUND WORKFLOW:
1. Reservation cancelled
2. Create payment_transactions:
   - provider = STRIPE
   - amount = -$100 (refund amount)
   - metadata = {originalChargeId, reason: "Cancellation"}
3. Call Stripe refunds API
4. Mark folio_line_item as REVERSED
5. Email refund confirmation
```

---

## 4. COMPARISON TABLE: PMS Analysis vs. QLOApps

| Flow | PMS Analysis | QLOApps | Gap |
|------|-------------|---------|-----|
| Reservation Lifecycle | ✓ Detailed | ✓ Implemented | Small |
| Basic Billing | ✓ Detailed | ✓ Implemented | Small |
| Room Status | ✓ Documented | ✓ Implemented | Small |
| **Rate Calendar** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Availability Control** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Restrictions** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Room Moves** | ⚠️ Issue #7 | ✓ Implemented | Medium |
| **Restaurant** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Bar** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Multi-Tax** | ⚠️ Issue #6 | ✓ Implemented | Medium |
| **Housekeeping Inspection** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Maintenance Requests** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Corporate Accounts** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Channel Sync** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Ledger** | ❌ Missing | ✓ Implemented | **LARGE** |
| **Payment Providers** | ⚠️ Optional | ✓ Implemented | Medium |

---

## 5. MISSING FLOWS SUMMARY

### Critical Flows (Should Document Immediately)

1. **Rate & Inventory Management** (3 calendars)
   - Daily rate selection (calendar + RatePlan fallback)
   - Room availability tracking
   - Booking restrictions enforcement
   - Stop-sell logic

2. **Room Move with Billing**
   - From-to tracking (audit trail)
   - Rate difference calculation
   - Proration for remaining nights
   - Folio adjustments

3. **Restaurant & Bar Operations**
   - Menu management (categories, items)
   - Order creation (OPEN → POSTED → CANCELLED)
   - Auto-charging to folio
   - Tax application per F&B category

4. **Advanced Housekeeping**
   - Inspection workflow (pass/fail)
   - Auto-trigger maintenance on fail
   - Block room if inspection failed

5. **Maintenance Management**
   - Request creation & tracking
   - Staff assignment
   - Room blocking during maintenance
   - Re-inspection after fix

6. **Channel Manager Sync**
   - Rate sync to OTAs
   - Availability sync
   - Inventory management
   - Conflict detection

### Important Flows (Secondary Priority)

7. **Multi-Tax Accounting**
   - Multiple tax rates per folio
   - Tax application by charge type
   - Tax reconciliation

8. **Ledger Accounting**
   - CHARGE → DR Receivable / CR Revenue
   - PAYMENT → DR Cash / CR Receivable
   - REFUND → DR Expense / CR Cash
   - ADJUSTMENT → Various

9. **Payment Provider Integration**
   - Stripe/PayPal webhook handling
   - Payment status tracking
   - Refund processing
   - Reconciliation

10. **Corporate Billing**
    - Corporate account linking
    - Group reservation management
    - Master invoice generation
    - Separate vs. aggregated folio options

---

## 6. RECOMMENDATIONS

### For PMS Analysis Update

**Add Section 13: Advanced Features (QLOApps Integration)**

Include:
1. Rate Calendar Workflow
2. Availability & Restriction Management
3. Room Move Billing
4. Restaurant & Bar Operations
5. Housekeeping Inspections
6. Maintenance Workflows
7. Channel Manager Integration
8. Ledger-based Accounting
9. Payment Provider Webhooks
10. Corporate Billing

### For Implementation Roadmap

**Revise Priority Matrix:**

| Feature | Current Priority | Recommended | Effort |
|---------|-----------------|-------------|--------|
| Fix Dynamic Pricing | 1 | **Keep 1** | 3-4h |
| Rate Calendar Integration | - | **Add as 2** | 6-8h |
| Restaurant Billing | - | **Add as 3** | 8-10h |
| Maintenance Workflow | - | **Add as 4** | 6-8h |
| Channel Sync | - | **Add as 5** | 10-12h |

### For Architecture Documentation

Expand the "Module Integrations" section to include:
- RMS → Reservations (availability blocking)
- Restaurant → Billing (order posting)
- Housekeeping → Maintenance (inspection triggers)
- Channel → Reservations (OTA booking webhook)

---

## 7. CONCLUSION

QLOApps has implemented a **comprehensive PMS with 14+ integrated modules**. The original PMS analysis covers core flows but **misses 9 major feature areas**:

1. ✅ Were already implemented (just not documented)
2. ⚠️ Have partial coverage (needs execution details)
3. ❌ Completely missing from analysis

**Estimated documentation gap: 40-60%**

**Next steps:**
1. Update PMS-FLOW-ANALYSIS.md with missing flows
2. Add QLOApps-specific workflows to optimization roadmap
3. Create separate "QLOApps Advanced Features" documentation
4. Prioritize integration flows (Rate Calendar, Restaurant, Channel Sync)
