# Sales Module

**Status:** Ready for implementation planning  
**Module Code:** `sales`

## 1. Purpose

The Sales module manages quotations, sales orders, commercial pricing, customer commitments and fulfilment progress.

## 2. Responsibilities

- Sales quotations
- Sales orders
- Customer pricing
- Discounts
- Credit checks
- Approval workflow
- Order confirmation
- Reservation requests
- Delivery progress
- Invoice progress
- Order cancellation and closure

## 3. Core Aggregates

### SalesQuotation

States:

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `APPROVED`
- `SENT`
- `ACCEPTED`
- `CONVERTED`
- `REJECTED`
- `EXPIRED`
- `CANCELLED`

### SalesOrder

Recommended status dimensions:

- `approval_status`
- `reservation_status`
- `delivery_status`
- `invoice_status`
- `payment_status`
- `overall_status`

### SalesOrderLine

- Product
- Quantity
- UOM
- Unit price
- Discount
- Tax
- Warehouse
- Requested delivery date
- Reserved quantity
- Delivered quantity
- Invoiced quantity

## 4. Core Business Rules

- Customer must be active.
- Credit-blocked customers cannot confirm credit orders without approved override.
- Prices and totals are calculated server-side.
- Discounts above authority require approval.
- Sales order confirmation creates a commitment, not revenue.
- Confirmation may request stock reservation.
- Confirmed orders cannot be freely edited.
- Posted downstream documents prevent unrestricted cancellation.
- Closing cancels only remaining open quantities.
- Sales order status must reflect actual fulfilment.

## 5. Main Use Cases

- Create quotation
- Submit quotation
- Approve quotation
- Send quotation
- Accept quotation
- Convert quotation to order
- Create sales order
- Submit order
- Approve order
- Confirm order
- Place order on hold
- Release hold
- Cancel order
- Close remaining quantity

## 6. API Endpoints

```text
POST   /api/v1/sales/quotations
GET    /api/v1/sales/quotations
GET    /api/v1/sales/quotations/{id}
PATCH  /api/v1/sales/quotations/{id}
POST   /api/v1/sales/quotations/{id}/submit
POST   /api/v1/sales/quotations/{id}/approve
POST   /api/v1/sales/quotations/{id}/accept
POST   /api/v1/sales/quotations/{id}/convert-to-order

POST   /api/v1/sales/orders
GET    /api/v1/sales/orders
GET    /api/v1/sales/orders/{id}
PATCH  /api/v1/sales/orders/{id}
POST   /api/v1/sales/orders/{id}/submit
POST   /api/v1/sales/orders/{id}/approve
POST   /api/v1/sales/orders/{id}/confirm
POST   /api/v1/sales/orders/{id}/place-on-hold
POST   /api/v1/sales/orders/{id}/release-hold
POST   /api/v1/sales/orders/{id}/cancel
POST   /api/v1/sales/orders/{id}/close
```

## 7. Permissions

- `quotation.view`
- `quotation.create`
- `quotation.approve`
- `quotation.send`
- `sales_order.view`
- `sales_order.create`
- `sales_order.approve`
- `sales_order.confirm`
- `sales_order.cancel`
- `sales_order.close`

## 8. Domain Events

- `QuotationCreated`
- `QuotationApproved`
- `QuotationAccepted`
- `QuotationConverted`
- `SalesOrderCreated`
- `SalesOrderApproved`
- `SalesOrderConfirmed`
- `SalesOrderPlacedOnHold`
- `SalesOrderCancelled`
- `SalesOrderClosed`

## 9. Cross-Module Contracts

Sales may call:

- Customer credit policy
- Pricing resolution
- Tax calculation
- Inventory reservation
- Workflow approval
- Finance invoice creation

Sales must not directly update Inventory or Finance tables.

## 10. Testing Requirements

- Pricing calculations
- Discount approval
- Credit-block enforcement
- Credit-limit enforcement
- Valid state transitions
- Optimistic concurrency
- Reservation request event
- Cancellation restrictions
- Tenant isolation
- Authorization
