# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 7: API Design, Integration Contracts and Event Architecture

**Document Status:** Initial API and Integration Design Draft
**Depends On:**

* Part 1 — Product Vision and Business Scope
* Part 2 — Detailed Business Requirements
* Part 3 — System Architecture and Domain Design
* Part 4 — Database Domain Model and ERD Design
* Part 5 — Detailed Module Workflows and Accounting Impact
* Part 6 — Security, Multi-Tenancy, Access Control and Compliance Design

**Architecture:** Multi-Tenant Modular Monolith
**API Style:** REST-first
**Internal Integration:** Application contracts and domain events
**Reliable Event Delivery:** Transactional outbox
**Primary Data Format:** JSON
**API Base Path:** `/api/v1`

---

# 1. Purpose of This Document

This document defines how clients, modules and external systems communicate with the ERP platform.

It establishes:

* REST API conventions
* Resource and endpoint naming
* Request and response standards
* Authentication and tenant context
* Validation and error handling
* Pagination, filtering and sorting
* Idempotency
* API versioning
* Explicit business command endpoints
* File upload and download APIs
* Import and export APIs
* Internal application contracts
* Domain-event structure
* Event naming and versioning
* Transactional outbox behaviour
* Event-consumer reliability
* Webhook architecture
* External integration adapters
* API and integration acceptance tests

The purpose is to prevent inconsistent APIs, hidden business actions and fragile module integrations.

---

# 2. API Design Principles

## Principle 1: APIs Represent Business Capabilities

Endpoints should reflect business resources and actions.

Correct:

```text
POST /api/v1/sales/orders/{id}/confirm
POST /api/v1/procurement/purchase-orders/{id}/approve
POST /api/v1/finance/customer-invoices/{id}/post
```

Incorrect:

```text
PATCH /api/v1/sales/orders/{id}
{
  "status": "CONFIRMED"
}
```

The explicit command endpoint ensures that all required business rules are executed.

---

## Principle 2: The Backend Is Authoritative

The backend must recalculate and validate:

* Prices
* Discounts
* Taxes
* Totals
* Credit exposure
* Stock availability
* Approval authority
* Exchange rates
* Accounting impact
* Tenant and company access

The frontend may display calculations, but it is not the final authority.

---

## Principle 3: APIs Are Tenant-Aware

Every request must execute inside a trusted tenant context.

The API must not trust unrestricted tenant IDs supplied by the client.

---

## Principle 4: APIs Are Versioned

All externally consumed endpoints must use a stable version.

```text
/api/v1
```

Backward-incompatible changes require a new version or a controlled deprecation strategy.

---

## Principle 5: Commands and Queries Are Distinct

Queries read data.

Commands perform business actions.

Examples:

```text
GET  /api/v1/sales/orders/{id}
POST /api/v1/sales/orders/{id}/confirm
```

---

## Principle 6: Errors Use Stable Codes

Clients should react to error codes rather than parsing human-readable messages.

Examples:

```text
CUSTOMER_CREDIT_BLOCKED
INSUFFICIENT_STOCK
FISCAL_PERIOD_CLOSED
APPROVAL_LIMIT_EXCEEDED
```

---

## Principle 7: Retry-Sensitive Operations Are Idempotent

Posting, payments, webhooks and imports must prevent duplicate effects.

---

# 3. API Base Structure

The initial API structure is:

```text
/api/v1/{module}/{resource}
```

Examples:

```text
/api/v1/crm/leads
/api/v1/sales/orders
/api/v1/procurement/purchase-orders
/api/v1/inventory/stock-movements
/api/v1/finance/customer-invoices
```

Platform endpoints:

```text
/api/v1/platform/tenants
/api/v1/identity/users
/api/v1/organization/companies
/api/v1/workflow/approvals
```

---

# 4. Resource Naming Conventions

## 4.1 Use Plural Resource Names

Correct:

```text
/customers
/sales-orders
/purchase-orders
/customer-invoices
```

Avoid:

```text
/customer
/salesOrder
/purchase_order
```

## 4.2 Use Kebab Case in URLs

```text
/customer-credit-profiles
/stock-reservations
/bank-reconciliations
```

## 4.3 Use Stable Business Names

Do not expose internal ORM names or implementation classes in URLs.

## 4.4 Use UUIDs as Resource Identifiers

Example:

```text
GET /api/v1/sales/orders/6fe56bc2-58ad-4b1a-a17d-63d77f1c0a4f
```

Business document numbers may also be searchable but should not replace internal IDs in API design.

---

# 5. Standard HTTP Methods

| Method | Purpose                                               |
| ------ | ----------------------------------------------------- |
| GET    | Read resource or collection                           |
| POST   | Create resource or execute command                    |
| PUT    | Replace a complete editable resource when appropriate |
| PATCH  | Update selected editable fields                       |
| DELETE | Delete eligible draft or temporary resource           |

Business posting, approval and cancellation should use explicit POST command endpoints.

---

# 6. Standard Request Headers

Common headers:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
Accept: application/json
X-Correlation-ID: <optional-client-correlation-id>
Idempotency-Key: <required-for-selected-operations>
```

Optional organization context:

```text
X-Company-ID: <company-uuid>
X-Branch-ID: <branch-uuid>
```

These headers are requests for context, not proof of access.

The backend must verify them against the authenticated user.

---

# 7. Authentication Context

After token validation, the backend creates a request context.

```text
RequestContext
├── user_id
├── session_id
├── tenant_id
├── active_company_id
├── active_branch_id
├── permissions
├── data_scopes
├── correlation_id
├── ip_address
└── user_agent
```

The context must be available to:

* Controllers
* Application handlers
* Repositories
* Audit logging
* Domain-event creation
* Background jobs

---

# 8. Standard Success Response

## 8.1 Single Resource

```json
{
  "success": true,
  "data": {
    "id": "6fe56bc2-58ad-4b1a-a17d-63d77f1c0a4f",
    "salesOrderNumber": "SO-MOG-2026-000125",
    "status": "CONFIRMED"
  },
  "meta": {
    "correlationId": "corr_01K0ABC123"
  }
}
```

## 8.2 Collection Response

```json
{
  "success": true,
  "data": [
    {
      "id": "6fe56bc2-58ad-4b1a-a17d-63d77f1c0a4f",
      "salesOrderNumber": "SO-MOG-2026-000125"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 140,
    "totalPages": 6,
    "correlationId": "corr_01K0ABC123"
  }
}
```

---

# 9. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_CREDIT_BLOCKED",
    "message": "The sales order cannot be confirmed because the customer is credit blocked.",
    "details": [
      {
        "field": "customerId",
        "code": "CUSTOMER_CREDIT_BLOCKED",
        "message": "The selected customer is not eligible for new credit orders."
      }
    ]
  },
  "meta": {
    "correlationId": "corr_01K0ABC123"
  }
}
```

The API must never expose:

* Stack traces
* SQL queries
* Internal file paths
* Secret values
* ORM implementation details

---

# 10. HTTP Status Code Standards

| Status | Usage                                 |
| ------ | ------------------------------------- |
| 200    | Successful query or command           |
| 201    | Resource created                      |
| 202    | Asynchronous job accepted             |
| 204    | Successful action with no body        |
| 400    | Invalid request format                |
| 401    | Authentication required or invalid    |
| 403    | Authenticated but not authorized      |
| 404    | Resource not found or inaccessible    |
| 409    | State conflict or duplicate operation |
| 422    | Business validation failure           |
| 429    | Rate limit exceeded                   |
| 500    | Unexpected server error               |
| 502    | External provider failure             |
| 503    | Service temporarily unavailable       |

Use `409 Conflict` for cases such as:

* Optimistic concurrency failure
* Duplicate idempotent operation mismatch
* Invalid document state transition

Use `422 Unprocessable Entity` for valid JSON that violates business rules.

---

# 11. Error Code Naming

Use uppercase snake case.

Format:

```text
DOMAIN_REASON
```

Examples:

```text
SALES_ORDER_NOT_CONFIRMABLE
CUSTOMER_CREDIT_BLOCKED
INSUFFICIENT_STOCK
PURCHASE_ORDER_ALREADY_CANCELLED
JOURNAL_NOT_BALANCED
FISCAL_PERIOD_CLOSED
TENANT_ACCESS_DENIED
DOCUMENT_VERSION_CONFLICT
```

Error codes should remain stable even if the message changes.

---

# 12. Validation Error Format

Example request:

```json
{
  "customerId": "",
  "orderDate": "invalid",
  "lines": []
}
```

Response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid data.",
    "details": [
      {
        "field": "customerId",
        "code": "REQUIRED",
        "message": "Customer is required."
      },
      {
        "field": "orderDate",
        "code": "INVALID_DATE",
        "message": "Order date must be a valid date."
      },
      {
        "field": "lines",
        "code": "MIN_ITEMS",
        "message": "At least one order line is required."
      }
    ]
  },
  "meta": {
    "correlationId": "corr_01K0ABC123"
  }
}
```

---

# 13. Pagination

Default pagination:

```text
?page=1&pageSize=25
```

Recommended limits:

```text
Default page size: 25
Maximum page size: 100
```

Example:

```text
GET /api/v1/sales/orders?page=2&pageSize=50
```

For very large datasets or high-volume feeds, cursor pagination may be introduced later.

---

# 14. Filtering

Example:

```text
GET /api/v1/sales/orders?status=CONFIRMED&customerId=<uuid>
```

Date range:

```text
GET /api/v1/finance/customer-invoices?postingDateFrom=2026-07-01&postingDateTo=2026-07-31
```

Multiple values:

```text
GET /api/v1/sales/orders?status=CONFIRMED,PARTIALLY_DELIVERED
```

Filters must be explicitly allowed.

Clients must not be allowed to submit arbitrary SQL-like expressions.

---

# 15. Sorting

Example:

```text
GET /api/v1/sales/orders?sort=-orderDate,salesOrderNumber
```

Meaning:

* `-orderDate`: descending
* `salesOrderNumber`: ascending

Only approved sortable fields should be supported.

---

# 16. Search

Module search:

```text
GET /api/v1/customers?search=Hodan
```

Global search:

```text
GET /api/v1/search?q=SO-MOG-2026-000125
```

Search results must respect:

* Tenant scope
* Company scope
* Branch scope
* Permissions
* Field-level security

---

# 17. Sparse Field Selection

Selected query endpoints may support:

```text
?fields=id,customerNumber,displayName,status
```

Sensitive or unauthorized fields must still be excluded.

Field selection must never bypass field-level security.

---

# 18. Resource Expansion

Selected endpoints may support controlled expansion.

Example:

```text
GET /api/v1/sales/orders/{id}?include=customer,lines,approvals
```

Allowed expansions must be predefined to prevent uncontrolled deep queries.

---

# 19. Create Resource Pattern

Example:

```text
POST /api/v1/sales/orders
```

Request:

```json
{
  "customerId": "ce1cbbab-72d4-4cc8-a35f-4c2a8897b120",
  "orderDate": "2026-07-25",
  "requestedDeliveryDate": "2026-07-30",
  "currencyCode": "USD",
  "warehouseId": "59bb113a-a702-41ec-bc81-45a13719e52e",
  "lines": [
    {
      "productId": "f52b979b-a732-42f8-afca-e10237c49318",
      "quantity": 50,
      "uomCode": "PCS"
    }
  ]
}
```

The backend determines or validates:

* Prices
* Taxes
* Discounts
* Totals
* Customer eligibility
* Product eligibility
* Company context

---

# 20. Update Draft Pattern

Example:

```text
PATCH /api/v1/sales/orders/{id}
```

Request:

```json
{
  "requestedDeliveryDate": "2026-08-01",
  "version": 3
}
```

The `version` supports optimistic concurrency.

Response conflict:

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_VERSION_CONFLICT",
    "message": "The sales order was modified by another user."
  },
  "meta": {
    "correlationId": "corr_01K0ABC123"
  }
}
```

---

# 21. Explicit Command Endpoint Pattern

Examples:

```text
POST /api/v1/sales/orders/{id}/submit
POST /api/v1/sales/orders/{id}/approve
POST /api/v1/sales/orders/{id}/confirm
POST /api/v1/sales/orders/{id}/cancel
POST /api/v1/sales/orders/{id}/close
```

Request example:

```json
{
  "version": 4,
  "comment": "Customer approval received."
}
```

The command endpoint must:

1. Load the aggregate
2. Verify tenant
3. Verify permission
4. Verify data scope
5. Verify workflow assignment
6. Verify version
7. Execute business rules
8. Save state
9. Record audit
10. Add outbox event
11. Return updated state

---

# 22. Long-Running Command Pattern

Long-running operations should return `202 Accepted`.

Example:

```text
POST /api/v1/reporting/exports
```

Response:

```json
{
  "success": true,
  "data": {
    "jobId": "5da72e2e-c439-4957-a534-80f803cc561f",
    "status": "QUEUED"
  },
  "meta": {
    "correlationId": "corr_01K0ABC123"
  }
}
```

Job status:

```text
GET /api/v1/jobs/{jobId}
```

---

# 23. Idempotency

## 23.1 Required Operations

Require an `Idempotency-Key` for:

* Payment creation
* Payment posting
* Invoice posting through external clients
* Mobile-money confirmation
* Bank callback handling
* External order creation
* Goods-receipt imports
* Webhook-triggered commands

## 23.2 Behaviour

First request:

```text
Idempotency-Key: payment-provider-transaction-123
```

The system stores:

* Tenant
* Key
* Operation
* Request hash
* Response
* Resource ID
* Expiry

Repeated identical request:

* Return original response
* Do not repeat business effect

Repeated request with different payload:

```text
409 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST
```

---

# 24. Bulk Operations

Bulk operations are useful for:

* Approvals
* Master-data updates
* Imports
* Status changes
* Record assignments

Example:

```text
POST /api/v1/workflow/approval-tasks/bulk-approve
```

Request:

```json
{
  "taskIds": [
    "7b15c7b4-9f57-45f4-8083-f2b204c3071d",
    "53d18871-74a7-4cd2-b531-aad7767e45bb"
  ],
  "comment": "Reviewed and approved."
}
```

Bulk actions must return per-record results.

```json
{
  "success": true,
  "data": {
    "succeeded": [
      {
        "id": "7b15c7b4-9f57-45f4-8083-f2b204c3071d"
      }
    ],
    "failed": [
      {
        "id": "53d18871-74a7-4cd2-b531-aad7767e45bb",
        "code": "APPROVAL_LIMIT_EXCEEDED",
        "message": "The task exceeds the user's approval authority."
      }
    ]
  },
  "meta": {
    "correlationId": "corr_01K0ABC123"
  }
}
```

Atomic all-or-nothing bulk operations should be used only when business requirements require them.

---

# 25. Delete Behaviour

DELETE should be limited to eligible resources such as:

* Draft document
* Temporary import
* Unsaved configuration
* Unused custom role

Example:

```text
DELETE /api/v1/sales/quotations/{id}
```

Posted or historically referenced records must use:

* Cancel
* Reverse
* Deactivate
* Archive

---

# 26. Customer API Examples

```text
POST   /api/v1/customers
GET    /api/v1/customers
GET    /api/v1/customers/{id}
PATCH  /api/v1/customers/{id}
POST   /api/v1/customers/{id}/submit
POST   /api/v1/customers/{id}/approve
POST   /api/v1/customers/{id}/place-on-hold
POST   /api/v1/customers/{id}/credit-block
POST   /api/v1/customers/{id}/reactivate
GET    /api/v1/customers/{id}/360-view
GET    /api/v1/customers/{id}/credit-exposure
```

---

# 27. Sales API Examples

## Quotations

```text
POST   /api/v1/sales/quotations
GET    /api/v1/sales/quotations
GET    /api/v1/sales/quotations/{id}
PATCH  /api/v1/sales/quotations/{id}
POST   /api/v1/sales/quotations/{id}/submit
POST   /api/v1/sales/quotations/{id}/approve
POST   /api/v1/sales/quotations/{id}/send
POST   /api/v1/sales/quotations/{id}/accept
POST   /api/v1/sales/quotations/{id}/revise
POST   /api/v1/sales/quotations/{id}/convert-to-order
```

## Sales Orders

```text
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
GET    /api/v1/sales/orders/{id}/fulfilment
```

---

# 28. Procurement API Examples

## Purchase Requests

```text
POST   /api/v1/procurement/purchase-requests
GET    /api/v1/procurement/purchase-requests
GET    /api/v1/procurement/purchase-requests/{id}
PATCH  /api/v1/procurement/purchase-requests/{id}
POST   /api/v1/procurement/purchase-requests/{id}/submit
POST   /api/v1/procurement/purchase-requests/{id}/approve
POST   /api/v1/procurement/purchase-requests/{id}/reject
POST   /api/v1/procurement/purchase-requests/{id}/cancel
```

## Purchase Orders

```text
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

---

# 29. Inventory and Warehouse API Examples

## Availability

```text
GET /api/v1/inventory/availability
```

Example:

```text
GET /api/v1/inventory/availability?productId=<uuid>&warehouseId=<uuid>
```

## Reservations

```text
POST   /api/v1/inventory/reservations
GET    /api/v1/inventory/reservations/{id}
POST   /api/v1/inventory/reservations/{id}/release
POST   /api/v1/inventory/reservations/{id}/extend
```

## Goods Receipts

```text
POST   /api/v1/warehouse/goods-receipts
GET    /api/v1/warehouse/goods-receipts/{id}
PATCH  /api/v1/warehouse/goods-receipts/{id}
POST   /api/v1/warehouse/goods-receipts/{id}/submit
POST   /api/v1/warehouse/goods-receipts/{id}/inspect
POST   /api/v1/warehouse/goods-receipts/{id}/post
POST   /api/v1/warehouse/goods-receipts/{id}/reverse
```

## Deliveries

```text
POST   /api/v1/warehouse/deliveries
GET    /api/v1/warehouse/deliveries/{id}
POST   /api/v1/warehouse/deliveries/{id}/start-picking
POST   /api/v1/warehouse/deliveries/{id}/complete-picking
POST   /api/v1/warehouse/deliveries/{id}/pack
POST   /api/v1/warehouse/deliveries/{id}/ship
POST   /api/v1/warehouse/deliveries/{id}/post
POST   /api/v1/warehouse/deliveries/{id}/reverse
```

---

# 30. Finance API Examples

## Customer Invoices

```text
POST   /api/v1/finance/customer-invoices
GET    /api/v1/finance/customer-invoices
GET    /api/v1/finance/customer-invoices/{id}
PATCH  /api/v1/finance/customer-invoices/{id}
POST   /api/v1/finance/customer-invoices/{id}/submit
POST   /api/v1/finance/customer-invoices/{id}/approve
POST   /api/v1/finance/customer-invoices/{id}/post
POST   /api/v1/finance/customer-invoices/{id}/reverse
GET    /api/v1/finance/customer-invoices/{id}/allocations
```

## Supplier Invoices

```text
POST   /api/v1/finance/supplier-invoices
GET    /api/v1/finance/supplier-invoices
GET    /api/v1/finance/supplier-invoices/{id}
POST   /api/v1/finance/supplier-invoices/{id}/match
POST   /api/v1/finance/supplier-invoices/{id}/approve-exception
POST   /api/v1/finance/supplier-invoices/{id}/post
POST   /api/v1/finance/supplier-invoices/{id}/reverse
```

## Payments

```text
POST   /api/v1/finance/payments
GET    /api/v1/finance/payments
GET    /api/v1/finance/payments/{id}
POST   /api/v1/finance/payments/{id}/submit
POST   /api/v1/finance/payments/{id}/approve
POST   /api/v1/finance/payments/{id}/post
POST   /api/v1/finance/payments/{id}/allocate
POST   /api/v1/finance/payments/{id}/reverse
```

---

# 31. Approval API Examples

```text
GET  /api/v1/workflow/approval-tasks
GET  /api/v1/workflow/approval-tasks/{id}
POST /api/v1/workflow/approval-tasks/{id}/approve
POST /api/v1/workflow/approval-tasks/{id}/reject
POST /api/v1/workflow/approval-tasks/{id}/return
POST /api/v1/workflow/approval-tasks/{id}/delegate
GET  /api/v1/workflow/documents/{documentType}/{documentId}/history
```

---

# 32. Reporting API Examples

```text
GET  /api/v1/reporting/reports/trial-balance
GET  /api/v1/reporting/reports/income-statement
GET  /api/v1/reporting/reports/balance-sheet
GET  /api/v1/reporting/reports/inventory-valuation
GET  /api/v1/reporting/reports/receivables-aging
POST /api/v1/reporting/exports
GET  /api/v1/reporting/exports/{id}
```

Reports must be filtered by authorized company and branch scope.

---

# 33. File Upload API

Recommended two-step process.

## Step 1: Request Upload

```text
POST /api/v1/documents/uploads
```

Request:

```json
{
  "filename": "supplier-quotation.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 504200,
  "recordType": "PURCHASE_ORDER",
  "recordId": "15fc0f97-a1d0-4456-a101-55391092a62d",
  "documentRole": "SUPPLIER_QUOTATION"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "fileId": "0bd49682-8198-4837-bb30-901f7ebd6f9c",
    "uploadUrl": "<short-lived-signed-url>",
    "expiresAt": "2026-07-25T16:15:00Z"
  },
  "meta": {
    "correlationId": "corr_01K0ABC123"
  }
}
```

## Step 2: Confirm Upload

```text
POST /api/v1/documents/uploads/{fileId}/complete
```

The system then:

* Verifies object exists
* Verifies size
* Verifies checksum where supported
* Queues malware scan
* Links file after clean result

---

# 34. File Download API

```text
POST /api/v1/documents/files/{fileId}/download-url
```

The backend verifies:

* Authentication
* Tenant
* Record permission
* File classification
* Scan status

Then returns a short-lived URL.

---

# 35. Import API

## Create Import

```text
POST /api/v1/imports
```

Request:

```json
{
  "importType": "CUSTOMERS",
  "fileId": "0bd49682-8198-4837-bb30-901f7ebd6f9c"
}
```

## Validate

```text
POST /api/v1/imports/{id}/validate
```

## Preview

```text
GET /api/v1/imports/{id}/preview
```

## Process

```text
POST /api/v1/imports/{id}/process
```

## Result

```text
GET /api/v1/imports/{id}/result
```

Import statuses:

```text
UPLOADED
VALIDATING
VALIDATION_FAILED
READY
PROCESSING
PARTIALLY_COMPLETED
COMPLETED
FAILED
CANCELLED
```

---

# 36. Export API

```text
POST /api/v1/exports
```

Request:

```json
{
  "resourceType": "CUSTOMER_INVOICES",
  "format": "XLSX",
  "filters": {
    "postingDateFrom": "2026-07-01",
    "postingDateTo": "2026-07-31",
    "status": ["POSTED", "PAID"]
  }
}
```

Response:

```text
202 Accepted
```

Export files must:

* Respect permissions
* Respect field masking
* Expire
* Be audited
* Use private object storage

---

# 37. Internal Application Contracts

Modules should not directly access another module’s repositories.

Instead, they use explicit application contracts.

Example inventory contract:

```text
InventoryAvailabilityPort
- getAvailability()
- reserveStock()
- releaseReservation()
- postDeliveryMovement()
```

Example finance contract:

```text
FinancialPostingPort
- postCustomerInvoice()
- postSupplierInvoice()
- postInventoryCost()
- reversePosting()
```

These contracts are in-process interfaces inside the modular monolith.

---

# 38. Synchronous Internal Calls

Use synchronous application calls when:

* Immediate consistency is required
* Operation belongs in one database transaction
* Failure must block the current command
* No long external wait exists

Examples:

* Validate fiscal period
* Allocate document number
* Confirm journal balance
* Reserve stock during controlled confirmation where required

Avoid deep chains across many modules.

---

# 39. Domain Events

Domain events represent completed business facts.

Examples:

```text
CustomerCreated
SalesOrderConfirmed
StockReserved
DeliveryPosted
CustomerInvoicePosted
PaymentReceived
PurchaseOrderApproved
GoodsReceiptPosted
```

Events use past tense.

Avoid command-like event names:

```text
ReserveStock
SendInvoice
ApprovePurchaseOrder
```

Those are commands, not events.

---

# 40. Domain Event Envelope

Standard event structure:

```json
{
  "eventId": "8a7698c4-7cbf-4ac4-bbd0-651a0e3b9369",
  "eventType": "SalesOrderConfirmed",
  "eventVersion": 1,
  "tenantId": "0e2c2f24-5dbe-4478-9684-19927b46e785",
  "companyId": "01f94b9d-c62b-4e62-925a-6ca9dc337f67",
  "aggregateType": "SalesOrder",
  "aggregateId": "6fe56bc2-58ad-4b1a-a17d-63d77f1c0a4f",
  "aggregateVersion": 4,
  "occurredAt": "2026-07-25T15:30:00Z",
  "actorId": "f95bc89d-34d7-48cf-b30f-843f9d445a46",
  "correlationId": "corr_01K0ABC123",
  "causationId": "cmd_01K0XYZ789",
  "payload": {
    "customerId": "ce1cbbab-72d4-4cc8-a35f-4c2a8897b120",
    "warehouseId": "59bb113a-a702-41ec-bc81-45a13719e52e"
  },
  "metadata": {
    "sourceModule": "sales"
  }
}
```

---

# 41. Event Payload Rules

Event payloads should include enough information for intended consumers but avoid unnecessary sensitive data.

Good payload:

```json
{
  "salesOrderId": "6fe56bc2-58ad-4b1a-a17d-63d77f1c0a4f",
  "warehouseId": "59bb113a-a702-41ec-bc81-45a13719e52e"
}
```

Avoid including:

* Full customer profile
* Full supplier bank details
* Password or token data
* Unneeded document contents
* Entire aggregate snapshots without reason

Consumers may query approved application interfaces if additional current data is required.

---

# 42. Event Versioning

Events must have an explicit version.

```text
SalesOrderConfirmed v1
SalesOrderConfirmed v2
```

Compatible additions may keep the same version when consumers tolerate unknown fields.

Breaking changes require a new version.

During migration:

* Old consumers may continue receiving v1
* New consumers may use v2
* Translation adapters may be used
* Deprecated versions require a retirement plan

---

# 43. Transactional Outbox

Business changes and event creation must occur in the same database transaction.

```text
BEGIN
  Update sales order
  Insert audit event
  Insert outbox event
COMMIT
```

A background worker later publishes the event.

## Outbox States

```text
PENDING
PROCESSING
PUBLISHED
FAILED
DEAD_LETTERED
```

## Outbox Worker Behaviour

1. Fetch available pending events
2. Lock selected rows
3. Publish internally
4. Record processing result
5. Retry failures
6. Move poison events to dead-letter status
7. Alert when retry threshold is exceeded

---

# 44. Internal Event Bus

Inside the modular monolith, the initial event bus may be:

* In-process event dispatcher
* Outbox-backed worker
* Redis-backed queue for asynchronous handlers

The design should not require Kafka at the MVP stage.

The key requirements are:

* Reliable delivery
* Idempotent consumers
* Retry
* Observability
* Tenant context
* Ordering where required

---

# 45. Event Consumer Idempotency

Every asynchronous consumer must track processed event IDs.

Suggested uniqueness:

```text
UNIQUE (consumer_name, event_id)
```

Consumer flow:

```text
Receive event
→ Check processed-events table
→ If processed, return success
→ Execute handler
→ Record event processed
```

The business effect and processed marker should be stored in one transaction where possible.

---

# 46. Event Ordering

Events may arrive late or out of order.

Consumers should use:

* Aggregate version
* Occurred-at timestamp
* Current state validation
* Sequence where required

Example:

```text
SalesOrderConfirmed aggregateVersion 4
SalesOrderCancelled aggregateVersion 5
```

If version 4 arrives after version 5, the consumer must not reopen the cancelled order.

---

# 47. Event Retry Policy

Suggested retry pattern:

```text
Attempt 1: immediate
Attempt 2: 30 seconds
Attempt 3: 2 minutes
Attempt 4: 10 minutes
Attempt 5: 1 hour
```

Retry rules depend on failure type.

Retryable:

* Temporary database outage
* Email provider timeout
* Network failure

Non-retryable:

* Invalid event schema
* Missing required configuration
* Unsupported event version

Non-retryable failures should be dead-lettered and reviewed.

---

# 48. Domain Event Handler Examples

## SalesOrderConfirmed

Handlers:

* Inventory requests stock reservation
* Notification informs warehouse planning
* Reporting updates order projection
* Audit preserves business action

## DeliveryPosted

Handlers:

* Sales updates delivered quantities
* Finance posts cost of goods sold
* Reporting updates fulfilment metrics
* Notifications may inform customer

## GoodsReceiptPosted

Handlers:

* Procurement updates received quantities
* Finance posts GRNI
* Reporting updates supplier delivery metrics
* Inventory checks reorder position

---

# 49. Command vs Event Example

Command:

```text
ConfirmSalesOrder
```

Meaning:

> A user or process requests confirmation.

Event:

```text
SalesOrderConfirmed
```

Meaning:

> The order was successfully confirmed.

A failed command must not publish the completed event.

---

# 50. Webhook Subscription API

Create subscription:

```text
POST /api/v1/integrations/webhooks
```

Request:

```json
{
  "name": "External Analytics",
  "endpointUrl": "https://example.com/erp-events",
  "eventTypes": [
    "CustomerInvoicePosted",
    "CustomerPaymentReceived"
  ]
}
```

The secret should be generated securely and shown according to security policy.

---

# 51. Outgoing Webhook Format

```json
{
  "id": "evt_8a7698c4",
  "type": "CustomerInvoicePosted",
  "version": 1,
  "createdAt": "2026-07-25T15:30:00Z",
  "data": {
    "invoiceId": "7ed7dc20-5cb8-44e9-99e7-a74369beb457",
    "invoiceNumber": "INV-2026-001250",
    "customerId": "ce1cbbab-72d4-4cc8-a35f-4c2a8897b120",
    "currency": "USD",
    "total": 1150.00
  }
}
```

Headers:

```text
X-ERP-Event-ID
X-ERP-Event-Type
X-ERP-Delivery-ID
X-ERP-Timestamp
X-ERP-Signature
```

---

# 52. Webhook Signature

Recommended HMAC concept:

```text
signature =
HMAC_SHA256(
  webhook_secret,
  timestamp + "." + raw_request_body
)
```

The receiver should:

1. Read raw body
2. Recalculate signature
3. Compare securely
4. Validate timestamp
5. Deduplicate event ID
6. Process event

---

# 53. Webhook Delivery States

```text
PENDING
SENDING
DELIVERED
FAILED
RETRY_SCHEDULED
DEAD_LETTERED
DISABLED
```

Subscriptions may be automatically disabled after repeated failures, subject to tenant notification.

---

# 54. Incoming Webhook Endpoint Pattern

Provider-specific endpoint:

```text
POST /api/v1/integrations/providers/{providerCode}/webhooks
```

Examples:

```text
/api/v1/integrations/providers/mobile-money/webhooks
/api/v1/integrations/providers/bank-x/webhooks
```

The adapter verifies provider-specific signature and translates payload into an internal command or event.

---

# 55. External Integration Adapter Pattern

```text
ERP Domain
    ↓
Integration Port
    ↓
Provider Adapter
```

Example payment port:

```text
PaymentProviderPort
- initiatePayment()
- verifyPayment()
- refundPayment()
- parseWebhook()
```

Provider adapters:

```text
MobileMoneyProviderAdapter
BankTransferProviderAdapter
CardPaymentProviderAdapter
```

Core Finance should not depend on provider-specific JSON structures.

---

# 56. Integration Configuration

Each provider configuration may include:

* Tenant
* Company
* Provider code
* Environment
* Encrypted credentials
* Callback configuration
* Allowed currencies
* Transaction limits
* Enabled status
* Last verification date

Configuration changes must be audited.

---

# 57. API Client Credentials

External applications should use service accounts or OAuth-style client credentials.

Each client should have:

* Client ID
* Secret or certificate
* Tenant scope
* Permissions
* Rate limit
* Expiry
* Status
* Last-used timestamp

Clients must not reuse employee passwords.

---

# 58. API Rate-Limit Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again later."
  },
  "meta": {
    "retryAfterSeconds": 60,
    "correlationId": "corr_01K0ABC123"
  }
}
```

Headers may include:

```text
Retry-After
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

---

# 59. Correlation and Trace Context

Every request should have a correlation ID.

If the client supplies one, validate its format.

Otherwise, generate one.

The same correlation ID should flow through:

* API request
* Application command
* Database transaction
* Audit event
* Outbox event
* Background job
* Notification
* External webhook

Distributed tracing standards may later use W3C Trace Context.

---

# 60. API Audit Requirements

Audit selected actions:

* Login
* Create sensitive master data
* Approval
* Posting
* Cancellation
* Reversal
* Bank-detail update
* Credit-limit update
* Payroll export
* Financial export
* Support access
* Integration configuration

Ordinary read operations may use technical access logs rather than permanent business audit records, except for restricted information.

---

# 61. API Documentation

The platform should generate OpenAPI documentation.

Documentation should include:

* Endpoints
* Authentication
* Permissions
* Request schema
* Response schema
* Error codes
* Pagination
* Idempotency requirements
* Example requests
* Example responses
* Deprecation notices

Sensitive internal endpoints should not be exposed in public documentation.

---

# 62. API Deprecation

Deprecation process:

1. Announce deprecation
2. Mark endpoint or field deprecated
3. Provide replacement
4. Track client usage
5. Maintain compatibility period
6. Remove in a future major version

Deprecation response headers may include:

```text
Deprecation: true
Sunset: <date>
Link: <replacement-documentation>
```

---

# 63. Internal Contract Testing

Internal module contracts should have automated tests.

Examples:

* Sales-to-Inventory reservation contract
* Warehouse-to-Finance costing contract
* Procurement-to-Inventory receipt contract
* Finance-to-Reporting posting contract

Tests should confirm:

* Input schema
* Output schema
* Error codes
* Tenant context
* Idempotency
* Failure behaviour

---

# 64. API Security Tests

## Test 1: Missing Authentication

Request protected endpoint without token.

Expected:

```text
401 AUTHENTICATION_REQUIRED
```

## Test 2: Wrong Tenant Resource

User requests another tenant’s sales order.

Expected:

```text
404 or 403
No data leakage
```

## Test 3: Direct Status Manipulation

Client patches status to `POSTED`.

Expected:

* Field ignored or rejected
* Explicit post command required

## Test 4: Hidden Field Injection

Client submits `approvedBy`, `tenantId` or `postedAt`.

Expected:

* Field rejected or ignored
* No unauthorized state change

## Test 5: Excessive Page Size

Client requests `pageSize=100000`.

Expected:

* Request rejected or capped

---

# 65. Idempotency Acceptance Tests

## Test 1: Duplicate Payment Request

Same key and same payload twice.

Expected:

* One payment
* Same response returned

## Test 2: Same Key, Different Payload

Expected:

```text
409 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST
```

## Test 3: Duplicate Goods Receipt Posting

Expected:

* One stock movement
* One accounting posting
* Original result returned or conflict safely handled

---

# 66. Event Acceptance Tests

## Test 1: Outbox Reliability

Business transaction commits while event dispatcher is offline.

Expected:

* Business change remains valid
* Outbox event remains pending
* Event publishes after recovery

## Test 2: Duplicate Event Delivery

Same event delivered twice.

Expected:

* Consumer processes once
* No duplicate business effect

## Test 3: Out-of-Order Event

Older aggregate version arrives later.

Expected:

* Consumer ignores or safely handles stale event

## Test 4: Poison Event

Invalid event repeatedly fails.

Expected:

* Retry policy applies
* Event moves to dead-letter state
* Alert is generated

---

# 67. Webhook Acceptance Tests

## Test 1: Valid Signature

Expected:

* Request accepted
* Event processed once

## Test 2: Invalid Signature

Expected:

```text
401 or 403
No business effect
Security log created
```

## Test 3: Replay Attempt

Same event ID sent again.

Expected:

* Duplicate safely ignored

## Test 4: Expired Timestamp

Expected:

* Request rejected according to provider policy

## Test 5: Receiver Failure

Outgoing webhook receiver returns 500.

Expected:

* Delivery marked failed
* Retry scheduled
* Core ERP transaction remains committed

---

# 68. API Performance Requirements

Initial targets:

* Common read endpoints: normally below 500 milliseconds
* Simple command endpoints: normally below 1 second
* Heavy reports: asynchronous
* Large imports: asynchronous
* Large exports: asynchronous
* All list endpoints: paginated

Performance must not compromise authorization or financial integrity.

---

# 69. API Observability

Track:

* Request count
* Response time
* Error rate
* Status codes
* Slow endpoints
* Authorization failures
* Tenant context
* Correlation IDs
* Idempotency conflicts
* External-provider latency
* Outbox backlog
* Dead-letter events
* Webhook success rate

---

# 70. API Definition of Done

The API and integration design phase is complete when:

* URL conventions are approved.
* Request and response envelopes are accepted.
* Error standards are defined.
* Pagination, filtering and sorting are defined.
* Command endpoint conventions are approved.
* Idempotency requirements are identified.
* File APIs are defined.
* Import and export flows are defined.
* Internal module contracts are documented.
* Event envelope is approved.
* Event naming and versioning are defined.
* Transactional outbox design is accepted.
* Consumer idempotency is defined.
* Event ordering rules are accepted.
* Webhook format and signature are defined.
* Integration adapter pattern is approved.
* API security tests are documented.
* API acceptance tests are ready for implementation.

---

# 71. API and Event Decision Summary

```text
External API:
REST under /api/v1

Business Actions:
Explicit command endpoints

Responses:
Standard success, error and metadata envelopes

Concurrency:
Optimistic version field

Reliability:
Idempotency keys and database constraints

Long Operations:
Asynchronous jobs with status endpoints

Internal Communication:
Application contracts and domain events

Event Reliability:
Transactional outbox

Consumer Reliability:
Processed-event deduplication and retries

External Notifications:
Signed and retryable webhooks

Integrations:
Ports and provider adapters

Documentation:
OpenAPI with stable error codes
```

---

# 72. Next Documentation Stage

## Part 8: Frontend Architecture, User Experience and Design System

The next document will define:

1. Frontend technology stack
2. Application shell
3. Multi-tenant and company switching
4. Navigation architecture
5. Role-based workspaces
6. Dashboard strategy
7. Page and feature structure
8. Form architecture
9. Table architecture
10. Search and command palette
11. Approval inbox
12. Notifications
13. Financial and inventory user experience
14. Responsive design
15. Accessibility
16. Internationalization
17. State management
18. Server-state management
19. Permission-aware UI
20. Error handling
21. Loading and empty states
22. Offline and unstable-network strategy
23. Frontend testing
24. Frontend folder structure
25. Design-system standards
