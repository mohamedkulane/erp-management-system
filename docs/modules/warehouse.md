# Warehouse Module

**Status:** Ready for implementation planning  
**Module Code:** `warehouse`

## 1. Purpose

The Warehouse module manages physical warehouse execution including receiving, put-away, picking, packing, shipping and operational tasks.

## 2. Responsibilities

- Warehouses and locations
- Goods receipts
- Inspection
- Put-away
- Picking tasks
- Packing
- Delivery execution
- Barcode workflows
- Lot and serial capture
- Warehouse task assignment
- Physical operation status

## 3. Core Entities

### GoodsReceipt

States:

- `DRAFT`
- `RECEIVING`
- `INSPECTION_PENDING`
- `PARTIALLY_ACCEPTED`
- `ACCEPTED`
- `POSTED`
- `REJECTED`
- `ON_HOLD`
- `CANCELLED`
- `REVERSED`

### Delivery

States:

- `DRAFT`
- `READY_TO_PICK`
- `PICKING`
- `PICKED`
- `PACKED`
- `READY_TO_SHIP`
- `SHIPPED`
- `DELIVERED`
- `POSTED`
- `PARTIALLY_DELIVERED`
- `FAILED_DELIVERY`
- `RETURNED`
- `CANCELLED`

### WarehouseTask

Types:

- Receiving
- Inspection
- Put-away
- Picking
- Packing
- Transfer
- Count

Task states:

- `CREATED`
- `ASSIGNED`
- `IN_PROGRESS`
- `COMPLETED`
- `ON_HOLD`
- `CANCELLED`
- `FAILED`

## 4. Business Rules

- Warehouse users can act only within authorized warehouse scope.
- Goods receipt must reference an eligible purchase order where applicable.
- Delivery must reference an eligible sales order or approved source.
- Product, quantity, location, lot and serial must be validated.
- Short picks require controlled resolution.
- Goods receipt posting creates Inventory movements.
- Delivery posting creates Inventory movements and requests COGS posting.
- Warehouse posting must be idempotent.
- Posted warehouse documents are immutable.

## 5. Main Use Cases

- Create goods receipt
- Receive quantity
- Inspect goods
- Accept or reject quantity
- Put away stock
- Create picking task
- Start and complete picking
- Pack delivery
- Ship delivery
- Post delivery
- Reverse delivery
- Create warehouse transfer task

## 6. API Endpoints

```text
POST   /api/v1/warehouse/goods-receipts
GET    /api/v1/warehouse/goods-receipts/{id}
PATCH  /api/v1/warehouse/goods-receipts/{id}
POST   /api/v1/warehouse/goods-receipts/{id}/inspect
POST   /api/v1/warehouse/goods-receipts/{id}/post
POST   /api/v1/warehouse/goods-receipts/{id}/reverse

POST   /api/v1/warehouse/deliveries
GET    /api/v1/warehouse/deliveries/{id}
POST   /api/v1/warehouse/deliveries/{id}/start-picking
POST   /api/v1/warehouse/deliveries/{id}/complete-picking
POST   /api/v1/warehouse/deliveries/{id}/pack
POST   /api/v1/warehouse/deliveries/{id}/ship
POST   /api/v1/warehouse/deliveries/{id}/post
POST   /api/v1/warehouse/deliveries/{id}/reverse

GET    /api/v1/warehouse/tasks
POST   /api/v1/warehouse/tasks/{id}/assign
POST   /api/v1/warehouse/tasks/{id}/complete
```

## 7. Permissions

- `warehouse.receipt_view`
- `warehouse.receive`
- `warehouse.inspect`
- `warehouse.receipt_post`
- `warehouse.pick`
- `warehouse.pack`
- `warehouse.ship`
- `warehouse.delivery_post`
- `warehouse.task_assign`

## 8. Domain Events

- `GoodsReceiptCreated`
- `GoodsReceiptPosted`
- `GoodsRejected`
- `PutAwayCompleted`
- `PickingStarted`
- `PickingCompleted`
- `DeliveryPacked`
- `DeliveryShipped`
- `DeliveryPosted`
- `DeliveryReversed`

## 9. Testing Requirements

- Purchase-order quantity validation
- Over-receipt tolerance
- Short-pick handling
- Barcode mismatch
- Lot and serial validation
- Warehouse-scope authorization
- Posting idempotency
- Inventory integration
- Finance-event integration
- Tenant isolation
