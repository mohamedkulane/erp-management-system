# Procurement Module

**Status:** Ready for implementation planning  
**Module Code:** `procurement`

## 1. Purpose

The Procurement module manages purchase requests, requests for quotation, supplier selection and purchase orders.

## 2. Responsibilities

- Purchase requests
- Budget-control integration
- RFQs
- Supplier quotation comparison
- Purchase orders
- Purchase-order approval
- Amendments
- Expected receipts
- Order cancellation and closure
- Supplier performance foundation

## 3. Core Aggregates

### PurchaseRequest

States:

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `APPROVED`
- `PARTIALLY_ORDERED`
- `FULLY_ORDERED`
- `CLOSED`
- `REJECTED`
- `CANCELLED`

### RequestForQuotation

States:

- `DRAFT`
- `ISSUED`
- `OPEN`
- `RESPONSES_RECEIVED`
- `EVALUATION`
- `AWARDED`
- `CLOSED`
- `EXPIRED`
- `CANCELLED`

### PurchaseOrder

States:

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `APPROVED`
- `SENT`
- `ACKNOWLEDGED`
- `PARTIALLY_RECEIVED`
- `RECEIVED`
- `PARTIALLY_INVOICED`
- `INVOICED`
- `CLOSED`
- `ON_HOLD`
- `CANCELLED`

## 4. Business Rules

- Supplier must be approved and active.
- Purchase quantities must be positive.
- Budget and approval rules may apply.
- Purchase-order changes after approval require amendment control.
- Received or invoiced quantities restrict cancellation.
- Purchase-order approval may increase expected incoming stock.
- A purchase order does not increase on-hand stock.
- Closing preserves completed quantities and cancels only remaining quantity.
- Supplier prices and terms must be authorized.

## 5. Main Use Cases

- Create purchase request
- Submit request
- Approve or reject request
- Create RFQ
- Record supplier quotation
- Compare quotations
- Award supplier
- Create purchase order
- Submit order
- Approve order
- Send order
- Amend order
- Cancel remaining quantity
- Close order

## 6. API Endpoints

```text
POST   /api/v1/procurement/purchase-requests
GET    /api/v1/procurement/purchase-requests
POST   /api/v1/procurement/purchase-requests/{id}/submit
POST   /api/v1/procurement/purchase-requests/{id}/approve
POST   /api/v1/procurement/purchase-requests/{id}/reject

POST   /api/v1/procurement/rfqs
POST   /api/v1/procurement/rfqs/{id}/issue
POST   /api/v1/procurement/rfqs/{id}/award

POST   /api/v1/procurement/purchase-orders
GET    /api/v1/procurement/purchase-orders
GET    /api/v1/procurement/purchase-orders/{id}
PATCH  /api/v1/procurement/purchase-orders/{id}
POST   /api/v1/procurement/purchase-orders/{id}/submit
POST   /api/v1/procurement/purchase-orders/{id}/approve
POST   /api/v1/procurement/purchase-orders/{id}/send
POST   /api/v1/procurement/purchase-orders/{id}/amend
POST   /api/v1/procurement/purchase-orders/{id}/cancel
POST   /api/v1/procurement/purchase-orders/{id}/close
```

## 7. Permissions

- `purchase_request.view`
- `purchase_request.create`
- `purchase_request.approve`
- `rfq.manage`
- `purchase_order.view`
- `purchase_order.create`
- `purchase_order.approve`
- `purchase_order.amend`
- `purchase_order.cancel`

## 8. Domain Events

- `PurchaseRequestCreated`
- `PurchaseRequestApproved`
- `RFQIssued`
- `SupplierAwarded`
- `PurchaseOrderCreated`
- `PurchaseOrderApproved`
- `PurchaseOrderSent`
- `PurchaseOrderAmended`
- `PurchaseOrderCancelled`
- `PurchaseOrderClosed`

## 9. Testing Requirements

- Supplier eligibility
- Budget policy
- Approval limits
- Amendment rules
- Cancellation restrictions
- Incoming-quantity event
- Tenant isolation
- Authorization
- State-machine validation
