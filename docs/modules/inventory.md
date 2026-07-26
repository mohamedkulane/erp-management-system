# Inventory Module

**Status:** Ready for implementation planning  
**Module Code:** `inventory`

## 1. Purpose

The Inventory module is the source of truth for stock quantities, reservations, movements and valuation.

## 2. Responsibilities

- Stock movements
- Stock balances
- Reservations
- Availability
- Lots
- Serial numbers
- Inventory valuation
- Adjustments
- Transfers
- Inventory counts
- Reorder alerts
- Integrity verification

## 3. Core Design Rule

Inventory quantities are derived from posted stock movements.

Direct editing of stock quantity is prohibited.

## 4. Core Entities

### StockMovement

- `id`
- `tenant_id`
- `company_id`
- `warehouse_id`
- `location_id`
- `product_id`
- `movement_type`
- `quantity`
- `uom_id`
- `unit_cost`
- `total_cost`
- `lot_id`
- `serial_id`
- `source_document_type`
- `source_document_id`
- `posted_at`
- `reversal_of_id`

Movement types:

- `OPENING`
- `RECEIPT`
- `DELIVERY`
- `CUSTOMER_RETURN`
- `SUPPLIER_RETURN`
- `TRANSFER_OUT`
- `TRANSFER_IN`
- `ADJUSTMENT_IN`
- `ADJUSTMENT_OUT`
- `REVERSAL`

### StockBalance

Projection fields:

- On hand
- Reserved
- Available
- Incoming
- Outgoing
- Quarantine
- Damaged

### StockReservation

States:

- `REQUESTED`
- `ACTIVE`
- `PARTIALLY_FULFILLED`
- `FULFILLED`
- `FAILED`
- `RELEASED`
- `EXPIRED`
- `CANCELLED`

### InventoryValuationLayer

Supports:

- Weighted average
- FIFO
- Standard cost
- Specific identification

## 5. Business Rules

- Every stock change creates a movement.
- Posted movements are immutable.
- Reversals create opposite movements.
- Available stock cannot be negative unless explicitly configured and approved.
- Reservations reduce available stock, not on-hand stock.
- Quarantine and damaged stock are unavailable.
- Serial numbers are unique.
- Lot and expiry validation must follow product configuration.
- Concurrent reservations must not oversell.
- Stock balances must reconcile to stock movements.

## 6. Main Use Cases

- Query availability
- Reserve stock
- Release reservation
- Post opening balance
- Post goods receipt movement
- Post delivery movement
- Post return
- Transfer stock
- Adjust inventory
- Run physical count
- Rebuild stock projection
- Verify inventory integrity

## 7. API Endpoints

```text
GET    /api/v1/inventory/availability
GET    /api/v1/inventory/balances
GET    /api/v1/inventory/movements

POST   /api/v1/inventory/reservations
GET    /api/v1/inventory/reservations/{id}
POST   /api/v1/inventory/reservations/{id}/release

POST   /api/v1/inventory/adjustments
POST   /api/v1/inventory/adjustments/{id}/approve
POST   /api/v1/inventory/adjustments/{id}/post
POST   /api/v1/inventory/adjustments/{id}/reverse

POST   /api/v1/inventory/transfers
POST   /api/v1/inventory/transfers/{id}/dispatch
POST   /api/v1/inventory/transfers/{id}/receive
```

## 8. Permissions

- `inventory.view`
- `inventory.reserve`
- `inventory.adjust`
- `inventory.adjust_approve`
- `inventory.transfer`
- `inventory.count`
- `inventory.cost_view`

## 9. Domain Events

- `StockReservationRequested`
- `StockReserved`
- `StockPartiallyReserved`
- `StockReservationFailed`
- `StockReservationReleased`
- `InventoryMovementPosted`
- `InventoryAdjusted`
- `StockTransferred`
- `StockBelowReorderLevel`

## 10. Testing Requirements

- Movement immutability
- Reservation concurrency
- Availability calculations
- Serial uniqueness
- Lot requirements
- Transfer total preservation
- Reversal correctness
- Valuation calculations
- Projection reconciliation
- Tenant isolation
