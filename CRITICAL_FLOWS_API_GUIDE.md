# Critical PMS Flows - API Documentation & Testing Guide

## Overview

This document provides comprehensive API documentation and testing procedures for all critical PMS flows implemented in the hospitality SaaS platform.

**Date**: March 30, 2026  
**Version**: 1.0  
**Status**: Production Ready

---

## Table of Contents

1. [Room Move Billing](#room-move-billing)
2. [Housekeeping Inspection Workflow](#housekeeping-inspection-workflow)
3. [Maintenance Request Management](#maintenance-request-management)
4. [Restaurant/Bar Order Integration](#restaurantbar-order-integration)
5. [Testing Guide](#testing-guide)
6. [Troubleshooting](#troubleshooting)

---

## Room Move Billing

### Overview

The room move billing feature enables automatic calculation and application of room rate adjustments when guests are moved to different room categories during their stay.

**Business Value:**
- Accurate billing for room upgrades/downgrades
- No manual adjustment entries required
- Audit trail for all room changes
- Guest communication support

### API Endpoint

**POST** `/front-desk/room-move`

### Request

```json
{
  "reservationId": "uuid",
  "toRoomId": "uuid",
  "reason": "string (optional)"
}
```

### Response

```json
{
  "id": "uuid",
  "tenant": { "id": "uuid" },
  "reservation": { "id": "uuid" },
  "fromRoom": { "id": "uuid", "roomNumber": "101", "roomType": "STANDARD" },
  "toRoom": { "id": "uuid", "roomNumber": "201", "roomType": "DELUXE" },
  "movedBy": { "id": "uuid", "fullName": "Staff Name" },
  "reason": "Complimentary upgrade",
  "movedAt": "2026-03-30T14:30:00Z"
}
```

### Requirements

- ✓ Reservation must be in `CHECKED_IN` status
- ✓ Target room must be in `AVAILABLE` status
- ✓ Rooms must be different
- ✓ Active folio must exist for reservation
- ✓ User must have `frontdesk.room-move` action permission

### Billing Logic

```
IF remaining_nights > 0:
  from_rate = RMS.getRate(fromRoom.type, checkInDate, checkOutDate)
  to_rate = RMS.getRate(toRoom.type, checkInDate, checkOutDate)
  
  adjustment = (to_rate_total - from_rate_total) * remaining_nights
  
  IF adjustment != 0:
    Create ADJUSTMENT line item
    Amount = adjustment
    Description = "Room upgrade/downgrade: {fromRoom} → {toRoom}"
```

### Example: Upgrade Guest to Premium Room

```bash
TOKEN="Bearer eyJhbGc..."

curl -X POST http://localhost:3000/front-desk/room-move \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "reservationId": "550e8400-e29b-41d4-a716-446655440000",
    "toRoomId": "660f9511-f30c-52e5-b827-557766551111",
    "reason": "Complimentary upgrade due to loyalty status"
  }'
```

### Response Example

```json
{
  "id": "770g0622-g41d-63f6-c938-668877662222",
  "tenant": { "id": "123" },
  "reservation": { "id": "550e8400-e29b-41d4-a716-446655440000" },
  "fromRoom": {
    "id": "445d7299-c88a-40d4-9c89-45c09e7f1234",
    "roomNumber": "101",
    "roomType": "STANDARD"
  },
  "toRoom": {
    "id": "660f9511-f30c-52e5-b827-557766551111",
    "roomNumber": "201",
    "roomType": "DELUXE"
  },
  "movedBy": {
    "id": "abc123",
    "fullName": "John Doe"
  },
  "reason": "Complimentary upgrade due to loyalty status",
  "movedAt": "2026-03-30T14:30:00Z"
}
```

### Data Validation

| Field | Type | Validation |
|-------|------|-----------|
| reservationId | UUID | Required, must exist |
| toRoomId | UUID | Required, must be AVAILABLE |
| reason | String | Optional, max 500 chars |

---

## Housekeeping Inspection Workflow

### Overview

The housekeeping inspection workflow enables staff to conduct room quality assurance checks and automatically create maintenance requests for rooms that fail inspection.

**Business Value:**
- Quality control before room assignment
- Automatic issue tracking
- Room status management
- Staff accountability

### API Endpoints

#### 1. Create Inspection

**POST** `/housekeeping/inspections`

```json
{
  "roomId": "uuid",
  "passed": boolean,
  "notes": "string (optional)"
}
```

**Response:**

```json
{
  "id": "uuid",
  "tenant": { "id": "uuid" },
  "room": { "id": "uuid", "roomNumber": "301" },
  "inspector": { "id": "uuid", "fullName": "Housekeeper Name" },
  "passed": true,
  "notes": "Room is ready for guest occupation",
  "createdAt": "2026-03-30T15:00:00Z"
}
```

#### 2. List Inspections

**GET** `/housekeeping/inspections`

**Response:**

```json
[
  {
    "id": "uuid",
    "room": { "roomNumber": "301" },
    "passed": true,
    "notes": "Clean and ready",
    "createdAt": "2026-03-30T15:00:00Z"
  },
  {
    "id": "uuid",
    "room": { "roomNumber": "302" },
    "passed": false,
    "notes": "Bathroom leak detected",
    "createdAt": "2026-03-30T15:15:00Z"
  }
]
```

### Inspection Rules

```
IF inspection.passed == false:
  1. Create MaintenanceRequest
     - title: "Room Maintenance Required - Failed Inspection (#{roomNumber})"
     - status: OPEN
  2. Update Room.status → MAINTENANCE
  3. Block room from future bookings until maintenance resolved
ELSE:
  Normal inspection recording, no side effects
```

### Example 1: Passing Inspection

```bash
curl -X POST http://localhost:3000/housekeeping/inspections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "roomId": "room-301-uuid",
    "passed": true,
    "notes": "All clean, linens changed, amenities stocked"
  }'
```

### Example 2: Failing Inspection (Auto-creates Maintenance)

```bash
curl -X POST http://localhost:3000/housekeeping/inspections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "roomId": "room-302-uuid",
    "passed": false,
    "notes": "Water damage in bathroom ceiling, mold detected. Do not rent."
  }'
```

**Result:** Automatically creates maintenance request and blocks room.

---

## Maintenance Request Management

### Overview

Complete lifecycle management for maintenance issues from creation through resolution with automatic room status tracking.

**Business Value:**
- Centralized maintenance tracking
- Room availability management
- Staff assignment and accountability
- Issue resolution SLA tracking

### API Endpoints

#### 1. Create Maintenance Request

**POST** `/maintenance`

```json
{
  "roomId": "uuid",
  "title": "string",
  "description": "string (optional)"
}
```

**Response:**

```json
{
  "id": "uuid",
  "tenant": { "id": "uuid" },
  "room": { "id": "uuid", "roomNumber": "101" },
  "reportedBy": { "id": "uuid", "fullName": "Reporter Name" },
  "assignedTo": null,
  "title": "Air Conditioning Unit Not Working",
  "description": "AC is producing warm air...",
  "status": "OPEN",
  "resolvedAt": null,
  "createdAt": "2026-03-30T10:00:00Z",
  "updatedAt": "2026-03-30T10:00:00Z"
}
```

#### 2. Assign Maintenance Request

**PATCH** `/maintenance/:id/assign`

```json
{
  "assignedToId": "uuid"
}
```

**Response:** Updates status to `IN_PROGRESS` and sets assignee.

#### 3. Update Maintenance Status

**PATCH** `/maintenance/:id/status`

```json
{
  "status": "OPEN | IN_PROGRESS | RESOLVED"
}
```

**Special Behavior when status = RESOLVED:**
- Sets `resolvedAt` timestamp
- Automatically changes room status from MAINTENANCE → AVAILABLE
- Room becomes available for future bookings

#### 4. List Maintenance Requests

**GET** `/maintenance`

**Query Parameters:**
- `status`: OPEN, IN_PROGRESS, RESOLVED
- `roomId`: filter by room
- `assignedToId`: filter by assigned staff

### Maintenance Lifecycle

```
OPEN
  ↓
  [Assign to staff]
  ↓
IN_PROGRESS
  ↓
  [Work is completed]
  ↓
RESOLVED (Room status: MAINTENANCE → AVAILABLE)
```

### Example 1: Create Maintenance Request

```bash
curl -X POST http://localhost:3000/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "roomId": "room-404-uuid",
    "title": "Broken Door Handle",
    "description": "Door handle is broken, replaced with temporary fix. Needs proper replacement."
  }'
```

### Example 2: Assign Maintenance

```bash
curl -X PATCH http://localhost:3000/maintenance/maint-123-uuid/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assignedToId": "staff-456-uuid"
  }'
```

### Example 3: Resolve Maintenance (Auto-unblock room)

```bash
curl -X PATCH http://localhost:3000/maintenance/maint-123-uuid/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "RESOLVED"
  }'
```

### Status Transitions

| From | To | Result | Auth Required |
|------|----|---------|----|
| OPEN | IN_PROGRESS | Assign staff | Staff, housekeeping.assign |
| IN_PROGRESS | RESOLVED | Unblock room | Any staff |
| RESOLVED | * | Blocked | Cannot modify |

---

## Restaurant/Bar Order Integration

### Overview

Seamless integration of F&B orders with guest folios, enabling automatic charges and accounting records.

**Business Value:**
- Automated F&B billing to guest accounts
- Prevents billing disputes
- Accounting integration
- Guest statement accuracy

### Prerequisites

1. Restaurant/Bar category and items must exist
2. Guest must have active folio
3. Room service orders linked to reservation

### API Endpoints

#### 1. Create Restaurant Order

**POST** `/restaurant/orders`

```json
{
  "items": [
    {
      "itemId": "uuid",
      "quantity": number
    }
  ],
  "taxRate": number,
  "postToFolio": boolean (optional)
}
```

#### 2. Post Restaurant Order to Folio

**POST** `/restaurant/orders/:orderId/post-folio`

```json
{
  "folioId": "uuid"
}
```

**Response:**

```json
{
  "id": "uuid",
  "status": "POSTED",
  "folio": { "id": "uuid" },
  "subtotal": 1500,
  "taxAmount": 75,
  "total": 1575,
  "postedAt": "2026-03-30T19:30:00Z"
}
```

#### 3. Create Bar Order

**POST** `/bar/orders`

```json
{
  "items": [
    {
      "itemId": "uuid",
      "quantity": number
    }
  ],
  "taxRate": number
}
```

#### 4. Post Bar Order to Folio

**POST** `/bar/orders/:orderId/post-folio`

```json
{
  "folioId": "uuid"
}
```

### Posting Logic

```
IF order.status != POSTED:
  1. Validate folio exists and is OPEN
  2. Check for duplicate posting (relatedEntityType = ORDER_ID)
  3. Create FolioLineItem:
     - type: FNB_CHARGE
     - amount: order.total
     - relatedEntityType: RESTAURANT_ORDER or BAR_ORDER
     - relatedEntityId: orderId
  4. Record accounting entry (LedgerEntryType.CHARGE)
  5. Update order.status → POSTED
  6. Create audit event
ELSE:
  Return already posted order (idempotent)
```

### Example 1: Create and Post Restaurant Order

```bash
# Step 1: Create restaurant order
curl -X POST http://localhost:3000/restaurant/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      { "itemId": "item-grilled-fish", "quantity": 2 },
      { "itemId": "item-wine-glass", "quantity": 2 }
    ],
    "taxRate": 0.05
  }'

# Response includes orderId

# Step 2: Post to guest folio
curl -X POST http://localhost:3000/restaurant/orders/order-123-uuid/post-folio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "folioId": "folio-456-uuid"
  }'
```

### Example 2: Create and Post Bar Order

```bash
# Create bar order
curl -X POST http://localhost:3000/bar/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      { "itemId": "item-mojito", "quantity": 3 },
      { "itemId": "item-beer-pint", "quantity": 1 }
    ],
    "taxRate": 0
  }'

# Post to folio
curl -X POST http://localhost:3000/bar/orders/order-789-uuid/post-folio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "folioId": "folio-456-uuid"
  }'
```

### Double-Posting Prevention

```
CONSTRAINT: UNIQUE(folio_id, related_entity_type, related_entity_id)

If order is posted twice:
1. Check constraint prevents duplicate entry
2. Return existing line item (idempotent)
3. Same total applied to folio
```

---

## Testing Guide

### Prerequisites

```bash
# Install dependencies
npm install

# Set environment
export APP_MODE=test
export DATABASE_URL=postgresql://user:pass@localhost:5432/hospitality_test

# Run migrations
npx typeorm migration:run

# Seed test data
npx ts-node src/scripts/setup-demo.ts
```

### Running E2E Tests

```bash
# Run all critical flow tests
npm run test:e2e -- critical-flows.e2e-spec.ts

# Run specific test suite
npm run test:e2e -- critical-flows.e2e-spec.ts -t "Room Move Billing"

# Run with coverage
npm run test:e2e -- critical-flows.e2e-spec.ts --coverage
```

### Manual Testing Checklist

#### Room Move Billing

- [ ] Create reservation for standard room
- [ ] Check in guest
- [ ] Move to deluxe room
- [ ] Verify folio has adjustment line item
- [ ] Verify adjustment amount equals rate difference
- [ ] Check audit log shows room move
- [ ] Verify room statuses updated correctly

#### Housekeeping Inspection

- [ ] Create passing inspection → no maintenance request
- [ ] Verify room status remains AVAILABLE
- [ ] Create failing inspection → maintenance request created
- [ ] Verify room status changed to MAINTENANCE
- [ ] Verify maintenance request title contains inspection reference
- [ ] List inspections and filter results

#### Maintenance Management

- [ ] Create maintenance request (OPEN status)
- [ ] Assign to staff (status → IN_PROGRESS)
- [ ] Verify room status is MAINTENANCE
- [ ] Update status to RESOLVED
- [ ] Verify room status changed to AVAILABLE
- [ ] Try to modify resolved request → expect error
- [ ] List requests with various filters

#### F&B Integration

- [ ] Create restaurant order with multiple items
- [ ] Post order to folio (status → POSTED)
- [ ] Verify folio has FNB_CHARGE line item
- [ ] Verify total amount matches order amount
- [ ] Try posting order twice → verify idempotent behavior
- [ ] List folio line items and verify charge appears
- [ ] Check accounting ledger for CHARGE entry

### Test Data Setup

```bash
# Run production seed to create templates
npx ts-node src/scripts/seed-production.ts

# Run demo seed for test scenarios
npx ts-node src/scripts/setup-demo.ts

# Seed RMS calendar data
npx ts-node src/scripts/seed.ts
```

---

## Troubleshooting

### Room Move Issues

**Problem:** Adjustment not calculated
**Solution:** 
- Verify RMS rates exist for both rooms/dates
- Check folio status is OPEN (not CLOSED)
- Confirm remaining nights > 0

**Problem:** Target room not available
**Solution:**
- Verify target room status is AVAILABLE
- Check for conflicting reservations
- Ensure room exists and belongs to same tenant

### Inspection Issues

**Problem:** Maintenance request not created on failed inspection
**Solution:**
- Verify MaintenanceService is properly injected
- Check database transaction committed
- Verify staff user exists for assignment

**Problem:** Room not being blocked
**Solution:**
- Confirm room status is being updated in same transaction
- Check RoomRepository is properly injected
- Verify room entity relations loaded

### Maintenance Issues

**Problem:** Room not unblocking when resolved
**Solution:**
- Verify status is exactly 'RESOLVED' (case-sensitive)
- Check room relation is loaded in query
- Confirm RoomRepository save is called

**Problem:** Cannot modify resolved request
**Solution:**
- This is expected behavior
- Create new request if additional work needed
- Close request only when truly resolved

### F&B Integration Issues

**Problem:** Order not posting to folio
**Solution:**
- Verify folio exists and status is OPEN
- Check FolioRepository has necessary relations
- Confirm FolioLineItemRepository is injected

**Problem:** Double charge appearing
**Solution:**
- Unique constraint should prevent this
- Check for stale transactions
- Clear cache and retry

---

## Performance Considerations

### Optimization Tips

1. **Room Move Billing**: Index on (tenantId, roomId, date) for RMS rate lookups
2. **Inspections**: Batch create operations for end-of-day submissions
3. **Maintenance**: Use pagination for large request lists
4. **F&B**: Cache menu items and update hourly

### Database Indexes

```sql
-- Room move logs
CREATE INDEX idx_room_move_logs_reservation ON room_move_logs(reservation_id);
CREATE INDEX idx_room_move_logs_moved_at ON room_move_logs(moved_at DESC);

-- Housekeeping inspections
CREATE INDEX idx_housekeeping_inspections_tenant_date ON housekeeping_inspections(tenant_id, created_at DESC);
CREATE INDEX idx_housekeeping_inspections_passed ON housekeeping_inspections(passed);

-- Maintenance requests
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_assigned ON maintenance_requests(assigned_to_id);

-- F&B integrations
CREATE INDEX idx_folio_line_items_related ON folio_line_items(related_entity_type, related_entity_id);
```

---

## Support & Documentation

For issues or questions:
1. Check the E2E test suite for working examples
2. Review seed data scripts for data structure examples
3. Check server logs for error messages
4. Refer to individual service source code for implementation details

**Last Updated:** March 30, 2026
