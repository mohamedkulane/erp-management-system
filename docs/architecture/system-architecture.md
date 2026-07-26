# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 3: System Architecture and Domain Design

**Document Status:** Initial Architecture Draft
**Depends On:**

* Part 1 — Product Vision, Business Scope and Project Foundation
* Part 2 — Detailed Business Requirements and Module Specifications

**Architecture Style:** Modular Monolith
**Integration Style:** Domain Events and Transactional Outbox
**Deployment Model:** Multi-Tenant Cloud SaaS
**Primary Database:** PostgreSQL

---

# 1. Purpose of This Document

This document defines the technical and domain architecture of the ERP platform.

It explains:

* How the platform will be divided into modules
* Which module owns each type of data
* How modules communicate
* How financial and inventory consistency will be protected
* How tenant data will be isolated
* How transactions, APIs, events and background jobs will operate
* How the application will be deployed and scaled
* Which architecture decisions are accepted for the first production version

The purpose is to prevent the ERP from becoming a large, unstructured application in which every module can directly modify every table.

---

# 2. Architecture Goals

The architecture must support the following goals:

1. Strong module boundaries
2. Reliable accounting transactions
3. Reliable inventory transactions
4. Secure tenant isolation
5. Multi-company and multi-branch operations
6. Configurable workflows
7. Full auditability
8. Horizontal application scaling
9. Background job processing
10. Real-time notifications
11. API integrations
12. Future module extraction
13. Maintainable source code
14. Testable business rules
15. Progressive delivery of ERP capabilities

---

# 3. Architecture Constraints

The architecture must respect the following constraints.

## 3.1 No Premature Microservices

The first production version will not use separate deployable services for every module.

Microservices would introduce:

* Distributed transactions
* Network failures
* More deployment pipelines
* More monitoring requirements
* More infrastructure costs
* Harder local development
* Event consistency challenges
* Operational complexity

The initial team should first establish correct business behaviour inside one deployable application.

## 3.2 Financial Transactions Must Remain Consistent

A posted financial transaction must not be partially completed.

For example, the system must not:

* Mark an invoice as posted without creating its journal
* Create only one side of a double-entry transaction
* Record a payment without updating the relevant ledger
* Reverse a document without reversing the financial impact

## 3.3 Inventory Transactions Must Remain Consistent

The system must not:

* Reduce stock without recording a movement
* Update stock balances through ordinary CRUD edits
* Reserve more stock than allowed
* Post a delivery without respecting stock rules
* Receive stock without a traceable source

## 3.4 Tenant Data Must Remain Isolated

Every tenant-owned table, cache key, object-storage file, background job and event must contain trusted tenant context.

## 3.5 Modules Must Not Bypass Ownership

One module must not directly update another module’s private tables.

For example:

* Sales must not directly edit inventory balances.
* Procurement must not directly insert journal lines.
* HR must not directly change payroll results.
* CRM must not directly post customer invoices.

---

# 4. Selected Architecture Style

The selected architecture is:

> A domain-oriented modular monolith with event-driven internal integration.

```text
Client Applications
        ↓
API Layer
        ↓
Application Modules
        ↓
Domain Models
        ↓
Infrastructure Adapters
        ↓
PostgreSQL, Redis, Storage and External Services
```

The application will initially be deployed as one backend system, but internally it will be divided into strongly isolated modules.

Each module will have:

* Its own domain model
* Its own application services
* Its own database access layer
* Its own API controllers
* Its own permissions
* Its own tests
* Its own domain events
* Its own migrations or schema ownership rules

---

# 5. High-Level System Context

```text
Employees, Managers, Customers and Administrators
                    ↓
              Web Application
                    ↓
               ERP Backend
                    ↓
 ┌────────────────────────────────────────────┐
 │ Identity and Access                        │
 │ Tenancy and Organization                   │
 │ CRM and Sales                              │
 │ Procurement and Supplier Management        │
 │ Inventory and Warehouse                    │
 │ Finance and Accounting                     │
 │ Workflow and Approvals                     │
 │ Documents and Notifications                │
 │ Reporting and Integrations                 │
 └────────────────────────────────────────────┘
                    ↓
 ┌────────────────────────────────────────────┐
 │ PostgreSQL                                 │
 │ Redis                                      │
 │ Object Storage                             │
 │ Background Job Queue                       │
 │ Email, SMS, WhatsApp and Payment Providers │
 └────────────────────────────────────────────┘
```

---

# 6. Architectural Layers

The backend will use four primary layers.

## 6.1 API Layer

Responsibilities:

* HTTP request handling
* Route definitions
* Authentication middleware
* Request validation
* Response transformation
* API versioning
* Rate limiting
* Correlation IDs

The API layer must not contain important business logic.

## 6.2 Application Layer

Responsibilities:

* Use cases
* Transaction coordination
* Permission checks
* Calling domain operations
* Calling repositories
* Publishing domain events
* Returning application results

Examples:

* CreateSalesOrder
* ApprovePurchaseOrder
* PostCustomerInvoice
* ReserveInventory
* ReceiveCustomerPayment

## 6.3 Domain Layer

Responsibilities:

* Entities
* Aggregates
* Value objects
* Domain services
* Business invariants
* Domain events
* Domain policies

The domain layer should not depend directly on:

* Express or NestJS
* PostgreSQL
* Redis
* Cloud storage
* Email providers
* HTTP concepts

## 6.4 Infrastructure Layer

Responsibilities:

* Database repositories
* ORM implementations
* Redis caching
* Object storage
* Queue implementations
* Email and SMS adapters
* External API adapters
* Logging
* Monitoring
* File scanning

---

# 7. Bounded Contexts

The ERP will be divided into bounded contexts.

A bounded context is a clearly defined business area with its own language, rules and data ownership.

The first planned bounded contexts are:

```text
Platform
├── Identity and Access
├── Tenancy
├── Organization
├── Configuration
├── Workflow
├── Audit
├── Notifications
├── Documents
└── Integrations

Commercial
├── CRM
├── Customer Management
├── Sales
├── Pricing
└── Customer Service

Supply
├── Supplier Management
├── Procurement
├── Inventory
├── Warehouse
└── Supply Planning

Finance
├── General Ledger
├── Accounts Receivable
├── Accounts Payable
├── Cash and Banking
├── Tax
├── Budgeting
└── Assets

Workforce
├── Human Resources
├── Attendance
├── Leave
├── Recruitment
├── Performance
└── Payroll

Operations
├── Projects
├── Manufacturing
├── Quality
├── Maintenance
└── Service Management
```

Not all bounded contexts will be implemented in the MVP.

---

# 8. Initial Module Boundaries

## 8.1 Identity Module

Owns:

* User accounts
* Credentials
* Authentication
* Sessions
* Multi-factor authentication
* Password policies
* Login history
* Service accounts

Does not own:

* Employee employment information
* Tenant subscription
* Company structure

## 8.2 Tenancy Module

Owns:

* Tenants
* Subscription plans
* Tenant status
* Enabled modules
* Tenant-level configuration
* Tenant branding
* Tenant storage quotas

## 8.3 Organization Module

Owns:

* Legal entities
* Branches
* Departments
* Cost centers
* Profit centers
* Business units
* Fiscal organization structure

## 8.4 Authorization Module

Owns:

* Roles
* Permissions
* Data scopes
* Policy assignments
* Delegations
* Segregation-of-duty rules

Identity and authorization may initially exist under one technical module but should remain separate domain concepts.

## 8.5 CRM Module

Owns:

* Leads
* Opportunities
* CRM activities
* Pipeline stages
* Lost reasons
* Lead scoring
* Campaign attribution

## 8.6 Customer Module

Owns:

* Customer profiles
* Customer contacts
* Customer addresses
* Credit configuration
* Customer groups
* Customer status

Finance owns customer financial balances.

Sales owns customer orders.

## 8.7 Sales Module

Owns:

* Quotations
* Sales orders
* Sales returns
* Commercial terms
* Sales document statuses
* Sales document lines
* Fulfilment requests

Sales does not own:

* Stock balances
* Customer receivables
* Posted accounting entries

## 8.8 Pricing Module

Owns:

* Price lists
* Price rules
* Promotions
* Discount rules
* Contract prices
* Price calculation policies

## 8.9 Supplier Module

Owns:

* Supplier profiles
* Supplier contacts
* Supplier addresses
* Supplier approval status
* Supplier categories
* Supplier ratings

## 8.10 Procurement Module

Owns:

* Purchase requests
* Requests for quotation
* Supplier quotation responses
* Purchase orders
* Purchase agreements
* Procurement approvals
* Purchase returns

## 8.11 Inventory Module

Owns:

* Stock movements
* Stock balances
* Stock reservations
* Inventory valuation layers
* Stock adjustments
* Lots
* Serial numbers
* Expiry information

Inventory is the source of truth for product quantity by location.

## 8.12 Warehouse Module

Owns:

* Warehouse tasks
* Put-away operations
* Picking
* Packing
* Shipping
* Warehouse zones
* Bins
* Warehouse task assignment

Inventory owns quantity and valuation.

Warehouse owns the physical fulfilment process.

## 8.13 Finance Module

Owns:

* Chart of accounts
* Journals
* Journal entries
* Ledger lines
* Fiscal periods
* Exchange rates used in posting
* Accounting dimensions
* Financial statements

## 8.14 Accounts Receivable Module

May initially be a submodule of Finance.

Owns:

* Customer invoices
* Credit notes
* Customer balances
* Customer receipts
* Payment allocations
* Receivable aging

## 8.15 Accounts Payable Module

May initially be a submodule of Finance.

Owns:

* Supplier invoices
* Debit notes
* Supplier balances
* Supplier payments
* Payment allocations
* Payable aging

## 8.16 Cash and Banking Module

Owns:

* Bank accounts
* Cash accounts
* Bank statement imports
* Reconciliation
* Cash transfers
* Payment instruments

## 8.17 Workflow Module

Owns:

* Workflow definitions
* Workflow versions
* Workflow instances
* Approval steps
* Approval assignments
* Delegations
* Escalations
* Approval history

## 8.18 Audit Module

Owns:

* Immutable audit events
* Security audit entries
* Administrative changes
* Data export records
* Support-access records

## 8.19 Notification Module

Owns:

* Notification templates
* Delivery preferences
* Delivery attempts
* Notification queues
* Provider results

## 8.20 Document Module

Owns:

* File metadata
* File versions
* Document links
* Security classifications
* Retention policies

Files themselves are stored in object storage.

## 8.21 Reporting Module

Owns:

* Read models
* Report definitions
* Dashboard configurations
* Scheduled reports
* Export jobs
* Analytical projections

Reporting must not become the source of truth for operational data.

---

# 9. Module Dependency Rules

The following rules will control dependencies.

## Rule 1

Platform modules may be used by business modules.

```text
Sales → Identity
Sales → Organization
Sales → Workflow
Sales → Audit
```

## Rule 2

Business modules must not directly depend on another module’s database implementation.

Incorrect:

```text
Sales Service
    ↓
Inventory ORM Table
```

Correct:

```text
Sales Application Service
    ↓
Inventory Application Contract
```

## Rule 3

Cross-module communication must occur through:

* Application interfaces
* Domain events
* Integration events
* Shared identifiers
* Approved read models

## Rule 4

Shared database access does not mean shared table ownership.

## Rule 5

Circular module dependencies are not allowed.

Incorrect:

```text
Sales → Inventory
Inventory → Sales
```

Preferred:

```text
Sales publishes SalesOrderConfirmed
Inventory reacts and publishes StockReserved
Sales updates fulfilment state from StockReserved
```

---

# 10. Module Dependency Map

```text
Identity
    ↑
Tenancy
    ↑
Organization
    ↑
Authorization

CRM
    ↓
Customer
    ↓
Sales
    ↓
Pricing

Supplier
    ↓
Procurement

Sales ───────────────┐
Procurement ─────────┤
Warehouse ───────────┤→ Inventory
Manufacturing ───────┘

Sales ───────────────┐
Procurement ─────────┤
Inventory ───────────┤
Payroll ─────────────┤→ Finance
Assets ──────────────┤
Projects ────────────┘

All Business Modules
    ↓
Workflow
Audit
Notifications
Documents
Reporting
```

---

# 11. Domain Entity Design

Entities have identity and lifecycle.

Examples:

* Tenant
* Company
* User
* Customer
* Supplier
* Product
* SalesOrder
* PurchaseOrder
* StockMovement
* JournalEntry
* Invoice
* Payment

Each entity must include only behaviour and data relevant to its domain.

---

# 12. Value Objects

Value objects represent domain concepts without independent identity.

Examples:

## Money

```text
Money
- amount
- currency
```

Money operations must prevent accidental arithmetic between different currencies.

## Address

```text
Address
- country
- region
- city
- street
- postal_code
```

## Quantity

```text
Quantity
- value
- unit_of_measure
```

## Date Range

```text
DateRange
- start_date
- end_date
```

## Tax Amount

```text
TaxAmount
- taxable_amount
- rate
- tax_amount
- tax_code
```

## Exchange Rate

```text
ExchangeRate
- source_currency
- target_currency
- rate
- effective_date
```

## Document Number

```text
DocumentNumber
- prefix
- sequence
- fiscal_period
```

---

# 13. Aggregates

An aggregate is a consistency boundary managed through one aggregate root.

## 13.1 Sales Order Aggregate

```text
SalesOrder
├── SalesOrderLine
├── SalesOrderTax
├── SalesOrderCharge
└── SalesOrderTerms
```

Aggregate root:

```text
SalesOrder
```

Rules:

* Lines cannot be modified after final confirmation except through controlled amendment.
* Order total must equal line totals, taxes, charges and discounts.
* A cancelled order cannot be delivered.
* A confirmed order must reference an active customer.
* Discount policies must be satisfied before confirmation.

## 13.2 Purchase Order Aggregate

```text
PurchaseOrder
├── PurchaseOrderLine
├── PurchaseOrderTax
├── PurchaseOrderCharge
└── DeliverySchedule
```

Rules:

* Supplier must be approved.
* Quantity must be greater than zero.
* Approved purchase orders require controlled amendments.
* Cancelled orders cannot receive goods.

## 13.3 Journal Entry Aggregate

```text
JournalEntry
└── JournalLine
```

Rules:

* Total debit must equal total credit.
* Posting period must be open.
* Accounts must be valid posting accounts.
* Posted journals cannot be edited.
* Reversal must reference the original journal.

## 13.4 Stock Movement Aggregate

```text
StockMovement
└── StockMovementLine
```

Rules:

* Source and destination cannot be identical where a transfer is expected.
* Product tracking requirements must be satisfied.
* Serial numbers cannot be duplicated.
* Movement quantity must be positive.
* Posting must update stock atomically.

## 13.5 Customer Invoice Aggregate

```text
CustomerInvoice
├── CustomerInvoiceLine
├── InvoiceTax
├── InvoiceCharge
└── PaymentAllocation
```

Rules:

* Invoice total must equal components.
* Invoice cannot be posted to an inactive customer.
* Posted invoice must create a balanced accounting transaction.
* Credit notes must reference invoice quantities and values where required.

---

# 14. Aggregate Design Rules

1. Aggregates should be small.
2. Transactions should normally modify one aggregate.
3. Cross-aggregate consistency should use domain events where immediate consistency is not mandatory.
4. Financial posting may coordinate multiple aggregates inside one database transaction.
5. Aggregate internals must not be modified directly from outside the aggregate root.
6. Historical records should not be overwritten without versioning or reversal.
7. Aggregate rules must be tested independently from infrastructure.

---

# 15. Database Architecture

The first production version will use:

```text
One PostgreSQL Cluster
        ↓
One Primary ERP Database
        ↓
Schema or ownership boundaries by module
```

A practical initial structure:

```text
platform
identity
organization
crm
sales
procurement
inventory
warehouse
finance
workflow
audit
notifications
documents
reporting
```

There are two reasonable implementation options.

## Option A: PostgreSQL Schemas

Examples:

```text
sales.sales_orders
sales.sales_order_lines

inventory.stock_movements
inventory.stock_balances

finance.journal_entries
finance.journal_lines
```

Benefits:

* Visible module ownership
* Easier permission separation
* Clear naming
* Easier future extraction analysis

## Option B: Shared Public Schema with Prefixes

Examples:

```text
sales_orders
inventory_stock_movements
finance_journal_entries
```

Benefits:

* Easier with some ORMs
* Simpler migrations
* Less schema configuration

## Selected Direction

Use PostgreSQL schemas when the selected ORM and migration tools support them reliably.

Otherwise, use strict table naming and repository boundaries.

The architectural rule matters more than the physical schema name.

---

# 16. Database Ownership

Each database table must have one owning module.

Examples:

| Table              | Owning Module |
| ------------------ | ------------- |
| tenants            | Tenancy       |
| users              | Identity      |
| roles              | Authorization |
| companies          | Organization  |
| customers          | Customer      |
| leads              | CRM           |
| sales_orders       | Sales         |
| purchase_orders    | Procurement   |
| stock_movements    | Inventory     |
| warehouse_tasks    | Warehouse     |
| journal_entries    | Finance       |
| workflow_instances | Workflow      |
| audit_events       | Audit         |
| file_metadata      | Documents     |

Non-owning modules must not directly perform write operations on these tables.

---

# 17. Multi-Tenant Database Model

The standard SaaS model will initially use:

```text
Shared Database
Shared Module Tables
tenant_id on Tenant-Owned Records
```

Example:

```text
sales_orders
- id
- tenant_id
- company_id
- customer_id
- document_number
- status
- total_amount
```

## 17.1 Tenant Ownership Rules

Every tenant-owned table must include:

* tenant_id
* created_at
* updated_at

Most business tables must also include:

* company_id
* branch_id where applicable

## 17.2 Composite Uniqueness

Uniqueness must normally include tenant scope.

```text
UNIQUE (tenant_id, customer_number)
UNIQUE (tenant_id, supplier_number)
UNIQUE (tenant_id, product_code)
UNIQUE (tenant_id, document_number)
```

Where numbering is company-specific:

```text
UNIQUE (tenant_id, company_id, document_number)
```

## 17.3 Foreign Key Scope

Where practical, foreign keys should enforce matching tenant ownership.

Example logical rule:

```text
Sales order tenant_id
must equal
Customer tenant_id
```

Possible implementation:

* Composite foreign keys
* Database triggers
* Application-level checks
* Repository-level trusted filters
* PostgreSQL Row-Level Security

## 17.4 Row-Level Security

PostgreSQL Row-Level Security may be used as an additional defence layer.

It must not replace application authorization.

Recommended defence:

```text
Authenticated Tenant Context
        +
Repository Tenant Filter
        +
Database Row-Level Security
        +
Audit Logging
```

---

# 18. Trusted Tenant Context

The client must not be trusted to define the authoritative tenant.

Incorrect:

```json
{
  "tenantId": "tenant-selected-by-user"
}
```

Correct flow:

```text
Authenticated Session
        ↓
Trusted User Identity
        ↓
Trusted Tenant Membership
        ↓
Server Creates Tenant Context
        ↓
Repository Uses Tenant Context
```

The request may include a company or branch selection, but the server must verify that the user has access to that organization.

---

# 19. Enterprise Tenant Isolation Options

The platform should later support three isolation tiers.

## Standard SaaS

```text
Shared Application
Shared Database
Shared Tables
```

## Enterprise SaaS

```text
Shared Application
Dedicated Database
```

## Regulated Deployment

```text
Dedicated Application
Dedicated Database
Dedicated Storage
Private Network
```

The first release only needs the standard shared-database model, but application contracts must not assume that all tenants permanently use the same database.

---

# 20. Transaction Boundaries

Database transactions must be used for operations requiring immediate consistency.

## 20.1 Customer Invoice Posting

One transaction should:

1. Validate invoice
2. Confirm fiscal period
3. Calculate totals
4. Create journal entry
5. Create journal lines
6. Update invoice status
7. Create receivable ledger impact
8. Add outbox event
9. Commit

If any step fails, all changes roll back.

## 20.2 Goods Receipt Posting

One transaction should:

1. Validate purchase order
2. Validate received quantities
3. Create stock movement
4. Update stock balance projection
5. Create valuation layer
6. Create accounting entry where applicable
7. Update purchase-order received quantity
8. Add outbox event
9. Commit

## 20.3 Customer Payment Posting

One transaction should:

1. Validate payment
2. Validate bank or cash account
3. Create payment record
4. Create payment allocations
5. Create journal entry
6. Update receivable balance
7. Add outbox event
8. Commit

---

# 21. Immediate and Eventual Consistency

## Immediate Consistency

Use immediate consistency for:

* Journal balancing
* Invoice posting
* Payment posting
* Stock posting
* Reservation limits
* Fiscal-period controls
* Document numbering
* Credit allocation
* Serial-number uniqueness

## Eventual Consistency

Use eventual consistency for:

* Notifications
* Search indexing
* Dashboards
* Analytics
* Email delivery
* SMS delivery
* Audit export
* External webhooks
* Non-critical projections

---

# 22. Domain Events

Domain events represent meaningful business occurrences.

Examples:

```text
CustomerCreated
LeadQualified
OpportunityWon
QuotationApproved
SalesOrderConfirmed
StockReservationRequested
StockReserved
StockReservationFailed
DeliveryPosted
CustomerInvoicePosted
CustomerPaymentReceived
PurchaseRequestApproved
PurchaseOrderApproved
GoodsReceived
SupplierInvoicePosted
SupplierPaymentCompleted
JournalPosted
FiscalPeriodClosed
```

Events must use past-tense names because they represent completed facts.

---

# 23. Domain Event Structure

A standard event envelope should include:

```text
event_id
event_type
event_version
tenant_id
company_id
aggregate_type
aggregate_id
occurred_at
actor_id
correlation_id
causation_id
payload
metadata
```

Example:

```json
{
  "event_id": "evt_123",
  "event_type": "SalesOrderConfirmed",
  "event_version": 1,
  "tenant_id": "tenant_001",
  "company_id": "company_001",
  "aggregate_type": "SalesOrder",
  "aggregate_id": "so_2026_00125",
  "occurred_at": "2026-07-22T08:00:00Z",
  "actor_id": "user_100",
  "correlation_id": "corr_500",
  "causation_id": "cmd_900",
  "payload": {
    "customer_id": "customer_15",
    "warehouse_id": "warehouse_01"
  }
}
```

---

# 24. Transactional Outbox Pattern

A database commit and event publication cannot be treated as two unrelated actions.

Incorrect flow:

```text
Save Sales Order
        ↓
Commit
        ↓
Publish Event
        ↓
Publication Fails
```

This creates inconsistent module state.

The selected solution is the transactional outbox pattern.

```text
Application Transaction
├── Save Business Changes
├── Insert Outbox Event
└── Commit
        ↓
Background Publisher
        ↓
Publish Event
        ↓
Mark Outbox Record Processed
```

## Outbox Table

Suggested fields:

```text
id
tenant_id
event_type
event_version
aggregate_type
aggregate_id
payload
headers
occurred_at
available_at
processed_at
attempt_count
last_error
status
```

---

# 25. Event Consumer Reliability

Every event consumer must be idempotent.

This means processing the same event twice must not create duplicate business effects.

Example:

```text
GoodsReceived Event
        ↓
Finance Consumer
        ↓
Check processed event ID
        ↓
If already processed: ignore
If not processed: create accounting effect
```

Suggested inbox fields:

```text
consumer_name
event_id
processed_at
result
```

Unique constraint:

```text
UNIQUE (consumer_name, event_id)
```

---

# 26. Command and Query Separation

The system will use practical command-query separation.

## Commands

Commands change state.

Examples:

* CreateSalesOrder
* ConfirmSalesOrder
* ApprovePurchaseOrder
* PostInvoice
* ReverseJournal

## Queries

Queries return data.

Examples:

* GetSalesOrder
* SearchCustomers
* GetInventoryAvailability
* GetTrialBalance
* GetPendingApprovals

The platform does not require a full complex CQRS infrastructure initially.

Commands and queries may use separate application handlers and data models while remaining in the same deployment.

---

# 27. API Architecture

The public API will use REST initially.

Base structure:

```text
/api/v1
```

Examples:

```text
POST   /api/v1/sales/orders
GET    /api/v1/sales/orders
GET    /api/v1/sales/orders/:id
POST   /api/v1/sales/orders/:id/submit
POST   /api/v1/sales/orders/:id/approve
POST   /api/v1/sales/orders/:id/confirm
POST   /api/v1/sales/orders/:id/cancel
```

State-changing actions should use explicit action endpoints rather than generic status updates.

Preferred:

```text
POST /sales/orders/:id/confirm
```

Avoid:

```text
PATCH /sales/orders/:id
{
  "status": "CONFIRMED"
}
```

The explicit action ensures that business rules are executed.

---

# 28. API Response Model

Successful response:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "correlationId": "corr_123"
  }
}
```

Validation error:

```json
{
  "success": false,
  "error": {
    "code": "SALES_ORDER_VALIDATION_FAILED",
    "message": "Sales order could not be confirmed.",
    "details": [
      {
        "field": "customerId",
        "message": "Customer is credit blocked."
      }
    ]
  },
  "meta": {
    "correlationId": "corr_123"
  }
}
```

---

# 29. API Design Rules

1. APIs must be versioned.
2. All list endpoints must support pagination.
3. Filters must be validated.
4. Authorization must occur server-side.
5. Sensitive fields must be filtered by permission.
6. Duplicate commands must support idempotency where required.
7. Errors must use stable error codes.
8. Correlation IDs must be returned.
9. Internal stack traces must not be returned.
10. Every data access request must include trusted tenant context.

---

# 30. Idempotency

Idempotency is required for actions that may be retried.

Examples:

* Payment creation
* External order import
* Webhook processing
* Invoice posting
* Mobile-money confirmation
* Bank transaction import

Request header:

```text
Idempotency-Key: unique-client-key
```

The server stores:

```text
tenant_id
idempotency_key
request_hash
response
status
created_at
expires_at
```

A repeated request with the same key should return the original result rather than creating a duplicate transaction.

---

# 31. Authentication Architecture

Recommended authentication model:

```text
Short-Lived Access Token
        +
Rotating Refresh Token
        +
Server-Side Session Record
```

## Access Token

Contains limited trusted claims:

* User ID
* Session ID
* Active tenant context
* Token version

Avoid storing a complete permission list inside long-lived tokens because permissions may change.

## Refresh Token

* Stored securely
* Rotated after use
* Revocable
* Linked to session and device

## Session Record

Contains:

* User
* Tenant
* Device
* IP history
* Creation time
* Last activity
* Expiration
* Revocation status

---

# 32. Authorization Architecture

Authorization will combine:

```text
RBAC
+
Organization Scope
+
Record Ownership
+
Field-Level Security
+
Approval Authority
+
Segregation of Duties
```

Example decision:

```text
Can user approve this purchase order?
```

The system evaluates:

1. Is the user authenticated?
2. Does the user belong to the tenant?
3. Does the user have `purchase_order.approve`?
4. Does the user have access to the company?
5. Does the user have access to the branch?
6. Is the order within the user’s approval limit?
7. Is the user prohibited because they created the order?
8. Is the workflow currently assigned to this user?

---

# 33. Policy-Based Authorization

Permissions should be evaluated through policies.

Example:

```text
PurchaseOrderApprovalPolicy
```

Inputs:

* User
* Roles
* Data scope
* Purchase order
* Workflow assignment
* Approval limit
* Segregation rules

Output:

```text
Allowed
Denied with Reason
Requires Additional Approval
```

Business services should not contain repeated ad hoc permission logic.

---

# 34. Audit Architecture

Audit logging will be centralized but events will be produced by every module.

## Business Audit Example

```text
Purchase order PO-2026-0012 approved by Finance Manager
```

## Security Audit Example

```text
User failed multi-factor authentication
```

## Administrative Audit Example

```text
User role changed from Accountant to Finance Manager
```

## Support Audit Example

```text
Platform support officer entered tenant support mode
```

Audit records should be append-only.

Sensitive payload values may require:

* Masking
* Encryption
* Redaction
* Hash comparison

Passwords and authentication secrets must never be written to audit logs.

---

# 35. Background Job Architecture

Background processing is required for:

* Email delivery
* SMS delivery
* WhatsApp delivery
* PDF generation
* Excel exports
* Large imports
* Scheduled reports
* Exchange-rate imports
* Webhook retries
* Search indexing
* Analytics projections
* Periodic stock alerts
* Expiry alerts

Recommended components:

```text
Redis
+
BullMQ
+
Dedicated Worker Processes
```

Queue examples:

```text
notifications
documents
imports
exports
integrations
reporting
maintenance
```

---

# 36. Background Job Rules

Every job must include:

```text
job_id
tenant_id
job_type
requested_by
correlation_id
payload
attempt_count
created_at
```

Jobs must support:

* Retry
* Exponential backoff
* Dead-letter handling
* Timeout
* Progress tracking
* Cancellation where safe
* Idempotency
* Tenant-aware rate limits

---

# 37. Caching Architecture

Redis may be used for:

* Session information
* Short-lived permission cache
* Tenant configuration
* Rate limiting
* Distributed locks
* Frequently used reference data
* Background queues

Redis must not be the only source of truth for:

* Financial balances
* Stock balances
* Approval status
* Payment status
* User credentials

## Cache Key Format

```text
erp:{environment}:{tenantId}:{module}:{resource}:{identifier}
```

Example:

```text
erp:prod:tenant_001:pricing:price_list:retail_usd
```

---

# 38. Distributed Locking

Distributed locks may be used for short operations such as:

* Allocating document numbers
* Preventing duplicate period close
* Preventing duplicate scheduled jobs
* Controlling the same import execution

Locks must have:

* Expiration
* Ownership token
* Safe release
* Timeout handling

Database constraints remain the preferred final protection against duplicates.

---

# 39. Document Numbering

Business documents require configurable numbering.

Examples:

```text
SO-MOG-2026-000001
PO-HRG-2026-000045
INV-2026-001250
```

Number sequence configuration may depend on:

* Tenant
* Company
* Branch
* Document type
* Fiscal year
* Prefix
* Reset policy

Sequence generation must be concurrency-safe.

Gaps may occur if a transaction reserves a number and later rolls back. The business must decide whether gapless numbering is legally required for specific document types.

---

# 40. File Storage Architecture

Files will be stored in S3-compatible object storage.

Examples:

* Cloudflare R2
* AWS S3
* MinIO
* Other compatible providers

Object key structure:

```text
/{environment}/{tenant_id}/{module}/{record_type}/{record_id}/{file_id}
```

Example:

```text
/prod/tenant_001/procurement/purchase-order/po_150/file_500.pdf
```

## File Access

Files must not be publicly accessible by default.

Access should use:

* Authenticated download endpoint
* Short-lived signed URL
* Permission check
* Audit event for sensitive files

---

# 41. File Security

Required protections:

* MIME-type validation
* File-size limits
* Extension validation
* Malware scanning
* Tenant-scoped object keys
* Filename normalization
* Access logging
* Encryption at rest
* Retention policy
* Deletion policy

The user-provided filename must not be used directly as the storage path.

---

# 42. Notification Architecture

Business modules publish notification requests.

Example:

```text
PurchaseOrderApprovalRequested
        ↓
Notification Policy
        ↓
Determine Recipients
        ↓
Create In-App Notification
        ↓
Queue Email or WhatsApp
```

Notification providers must use adapters.

```text
NotificationProvider
├── EmailProvider
├── SMSProvider
├── WhatsAppProvider
└── PushProvider
```

Failure of an email or SMS must not roll back an approved business transaction.

---

# 43. Real-Time Architecture

Socket.IO or WebSocket may be used for:

* New approval notifications
* Dashboard refresh signals
* Stock update signals
* Job progress
* Import progress
* Chat or internal activity
* Security-session alerts

Real-time messages must be scoped by:

* Tenant
* User
* Role
* Company
* Branch
* Record permission

Room examples:

```text
tenant:tenant_001
user:user_150
company:company_01
branch:branch_mog
approval-role:finance_manager
```

Clients must not be able to subscribe to arbitrary tenant rooms.

---

# 44. Reporting Architecture

Operational reports may query the transactional database through optimized read models.

Heavy analytical reporting should not run directly against highly active transactional tables indefinitely.

## Initial Reporting Model

```text
Transactional Tables
        ↓
Database Views and Read Models
        ↓
Reporting API
        ↓
Dashboard and Exports
```

## Future Analytical Model

```text
Transactional Database
        ↓
Outbox or Change Data Capture
        ↓
Analytics Pipeline
        ↓
Warehouse or Analytical Store
        ↓
Business Intelligence
```

---

# 45. Read Models

Read models may combine data from multiple modules for display.

Examples:

* Customer 360 view
* Sales order fulfilment view
* Purchase order status view
* Inventory availability view
* Executive financial dashboard

Read models are not allowed to become uncontrolled write models.

---

# 46. Search Architecture

Initial search may use PostgreSQL:

* Full-text search
* Trigram indexes
* Structured filters

Future search may use a search engine if required.

Search documents must include:

* Tenant ID
* Company scope
* Record type
* Record ID
* Permission metadata

Search results must be reauthorized before sensitive data is returned.

---

# 47. Import Architecture

Large imports must use staged processing.

```text
Upload File
        ↓
Store Original File
        ↓
Create Import Job
        ↓
Parse Rows
        ↓
Validate
        ↓
Produce Preview
        ↓
User Confirms
        ↓
Process Valid Rows
        ↓
Generate Result Report
```

Import statuses:

```text
Uploaded
Validating
Validation Failed
Ready
Processing
Partially Completed
Completed
Failed
Cancelled
```

An import should not create thousands of uncontrolled partial records without a clear result report.

---

# 48. Integration Architecture

External integrations will use ports and adapters.

```text
ERP Domain
    ↓
Integration Interface
    ↓
Provider Adapter
```

Example:

```text
PaymentGateway
├── MobileMoneyAdapter
├── BankAdapter
└── CardPaymentAdapter
```

The accounting domain should understand:

* Payment received
* Payment failed
* Payment reversed

It should not understand provider-specific HTTP fields.

---

# 49. Webhook Architecture

Outgoing webhook flow:

```text
Business Event
        ↓
Webhook Subscription Match
        ↓
Create Delivery Job
        ↓
Sign Request
        ↓
Send
        ↓
Record Result
        ↓
Retry if Required
```

Webhook delivery should include:

* Event ID
* Event type
* Timestamp
* Tenant-safe payload
* Signature
* Retry number

Webhook consumers may receive duplicate deliveries and must be instructed to use event IDs for deduplication.

---

# 50. Observability Architecture

The system must provide:

* Structured logs
* Metrics
* Traces
* Error tracking
* Health checks
* Queue monitoring
* Database monitoring
* Security alerts

## Structured Log Fields

```text
timestamp
level
service
module
tenant_id
user_id
correlation_id
request_id
event
message
duration
error_code
```

Sensitive financial and personal data should not be included casually in logs.

---

# 51. Correlation and Causation

Every request receives a correlation ID.

Example process:

```text
Confirm Sales Order
Correlation ID: corr_001
        ↓
Reserve Inventory
Correlation ID: corr_001
        ↓
Create Notification
Correlation ID: corr_001
```

Events should also contain causation IDs.

```text
SalesOrderConfirmed
caused by
ConfirmSalesOrderCommand
```

This allows one business operation to be traced across modules and workers.

---

# 52. Error Handling

Errors should be divided into:

```text
Validation Error
Business Rule Error
Authorization Error
Conflict Error
Not Found Error
Integration Error
Infrastructure Error
Unexpected Error
```

Examples:

```text
CUSTOMER_CREDIT_BLOCKED
INSUFFICIENT_STOCK
FISCAL_PERIOD_CLOSED
JOURNAL_NOT_BALANCED
PURCHASE_ORDER_ALREADY_CANCELLED
DUPLICATE_SERIAL_NUMBER
```

The user should receive a clear business message.

Technical details should be recorded internally with the correlation ID.

---

# 53. Data Integrity Controls

The database should enforce:

* Primary keys
* Foreign keys
* Unique constraints
* Not-null constraints
* Check constraints
* Decimal precision
* Valid status values where appropriate
* Optimistic concurrency version
* Tenant ownership rules

Application validation does not replace database constraints.

---

# 54. Monetary Data Rules

Money must use decimal database types.

Do not use floating-point types for financial amounts.

Suggested examples:

```text
NUMERIC(19, 4)
```

For exchange rates or high precision:

```text
NUMERIC(19, 8)
```

All financial tables should record:

* Transaction currency
* Transaction amount
* Base currency
* Base amount
* Exchange rate used

---

# 55. Time and Date Rules

Store timestamps in UTC.

Store business dates separately when needed.

Examples:

```text
created_at          timestamp with time zone
document_date       date
posting_date        date
due_date            date
```

Display timestamps in the user’s configured time zone.

Fiscal posting must depend on the business posting date, not only the technical creation timestamp.

---

# 56. Concurrency Control

The system must protect against two users modifying the same document.

Recommended optimistic concurrency:

```text
version
```

Update condition:

```text
WHERE id = :id
AND version = :expectedVersion
```

If no row is updated, return:

```text
DOCUMENT_MODIFIED_BY_ANOTHER_USER
```

For highly sensitive posting operations, stronger database locking may be used.

---

# 57. Soft Deletion and Deactivation

Business master records with transaction history should normally be deactivated instead of deleted.

Examples:

* Customer
* Supplier
* Product
* Employee
* Account
* Warehouse

Draft records without downstream references may be deleted if permissions allow.

Audit events must remain preserved.

---

# 58. Data Retention

Retention policies should be configurable by record category.

Examples:

* Audit events
* Financial records
* Payroll records
* Attachments
* Security logs
* Integration logs
* Temporary imports
* Export files

Retention deletion must not violate legal or financial preservation requirements.

---

# 59. Deployment Architecture

Initial production deployment:

```text
Internet
   ↓
Cloud Load Balancer or Nginx
   ↓
ERP API Instances
   ↓
PostgreSQL
Redis
Object Storage
Worker Instances
```

Detailed view:

```text
Users
  ↓
CDN / WAF
  ↓
Load Balancer
  ├── ERP API Instance 1
  ├── ERP API Instance 2
  └── ERP API Instance N
          ↓
  ┌────────────────────────┐
  │ Managed PostgreSQL     │
  │ Managed Redis          │
  │ Object Storage         │
  │ Background Workers     │
  │ Monitoring Platform    │
  └────────────────────────┘
```

---

# 60. Application Processes

The deployment may contain separate process types.

## API Process

Handles:

* HTTP requests
* Authentication
* Queries
* Commands
* WebSocket connections

## Worker Process

Handles:

* Queue jobs
* Events
* Imports
* Exports
* Notifications
* Webhook deliveries

## Scheduler Process

Handles:

* Recurring jobs
* Expiry checks
* Overdue reminders
* Scheduled reports
* Cleanup
* Exchange-rate updates

These can use the same source code while running different commands.

---

# 61. Scaling Strategy

## Horizontal API Scaling

API instances must remain stateless.

Do not store sessions or uploaded files only on local disk.

## Worker Scaling

Workers may scale by queue type.

Example:

```text
Notification Workers: 4
Import Workers: 2
Report Workers: 2
Integration Workers: 3
```

## Database Scaling

Initial strategy:

* Managed PostgreSQL
* Correct indexing
* Connection pooling
* Query monitoring
* Read replicas for reporting when justified

Partitioning should only be introduced for tables that demonstrate the need.

Likely future candidates:

* Audit events
* Journal lines
* Stock movements
* Notification history
* Integration logs

---

# 62. Backup and Recovery Architecture

Required capabilities:

* Automated full backups
* Point-in-time recovery
* Object-storage versioning
* Encrypted backups
* Restore testing
* Backup monitoring
* Defined recovery objectives

Preliminary objectives:

```text
RPO: 15 minutes or better
RTO: 4 hours or better
```

Enterprise plans may later provide stronger targets.

---

# 63. Development Environment

Recommended local environment:

```text
Docker Compose
├── PostgreSQL
├── Redis
├── MinIO
├── Mail Testing Server
└── ERP Backend
```

Developers should be able to run the main platform without requiring access to production cloud services.

External adapters should provide sandbox or fake implementations.

---

# 64. Testing Architecture

## Unit Tests

Test:

* Domain rules
* Value objects
* Policies
* Calculations
* State transitions

## Integration Tests

Test:

* Repositories
* Database constraints
* Transactions
* Outbox
* Redis
* Object storage adapters

## Contract Tests

Test:

* Module application interfaces
* External provider adapters
* Webhook payloads
* API schemas

## End-to-End Tests

Test complete flows:

* Procure-to-pay
* Lead-to-cash
* Inventory transfer
* Invoice and payment
* Approval workflow
* Period closing

## Security Tests

Test:

* Tenant isolation
* Permission bypass attempts
* Branch restrictions
* Field-level security
* Object-storage access
* Export restrictions

---

# 65. Recommended Backend Technology

## Preferred Option

```text
Node.js
TypeScript
NestJS
PostgreSQL
Prisma or Drizzle
Redis
BullMQ
Socket.IO
S3-Compatible Storage
```

NestJS is recommended because the platform needs:

* Modules
* Dependency injection
* Guards
* Interceptors
* Validation
* Background workers
* WebSockets
* Testing support
* Large-team structure

A well-structured Express application is also possible, but it would require more internal conventions to prevent architectural drift.

---

# 66. Recommended Frontend Architecture

```text
React
TypeScript
Vite
TanStack Query
Zustand
React Hook Form
Zod
Tailwind CSS
shadcn/ui
TanStack Table
Recharts
```

Frontend responsibilities:

* User experience
* Local form state
* Server-state caching
* Optimistic user feedback
* Permission-aware navigation
* Accessible interfaces
* Responsive design

The frontend must not become the final authority for:

* Permissions
* Prices
* Taxes
* Financial totals
* Stock availability
* Approval authority

All critical values must be validated by the backend.

---

# 67. Backend Folder Structure

```text
server/
├── package.json
├── tsconfig.json
├── Dockerfile
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│
├── scripts/
│   ├── create-platform-admin.ts
│   ├── migrate-tenant.ts
│   ├── rebuild-projections.ts
│   └── verify-ledger-balances.ts
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── auth.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── storage.config.ts
│   │   └── env.validation.ts
│   │
│   ├── platform/
│   │   ├── identity/
│   │   ├── tenancy/
│   │   ├── organization/
│   │   ├── authorization/
│   │   ├── workflow/
│   │   ├── audit/
│   │   ├── notifications/
│   │   ├── documents/
│   │   ├── integrations/
│   │   └── configuration/
│   │
│   ├── modules/
│   │   ├── crm/
│   │   ├── customers/
│   │   ├── pricing/
│   │   ├── sales/
│   │   ├── suppliers/
│   │   ├── procurement/
│   │   ├── inventory/
│   │   ├── warehouse/
│   │   ├── finance/
│   │   ├── payments/
│   │   ├── tax/
│   │   ├── assets/
│   │   ├── hr/
│   │   ├── payroll/
│   │   ├── projects/
│   │   ├── manufacturing/
│   │   ├── maintenance/
│   │   └── reporting/
│   │
│   ├── shared/
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   ├── database/
│   │   ├── events/
│   │   ├── errors/
│   │   ├── logging/
│   │   ├── security/
│   │   ├── tenancy/
│   │   ├── validation/
│   │   └── testing/
│   │
│   └── workers/
│       ├── outbox/
│       ├── notifications/
│       ├── reports/
│       ├── imports/
│       ├── exports/
│       └── integrations/
│
└── test/
    ├── integration/
    ├── e2e/
    ├── fixtures/
    └── helpers/
```

---

# 68. Internal Module Structure

Each business module should follow a consistent structure.

```text
sales/
├── sales.module.ts
├── api/
│   ├── controllers/
│   ├── dto/
│   ├── presenters/
│   └── guards/
│
├── application/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   ├── services/
│   ├── ports/
│   └── policies/
│
├── domain/
│   ├── aggregates/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   ├── services/
│   ├── repositories/
│   └── errors/
│
├── infrastructure/
│   ├── persistence/
│   ├── repositories/
│   ├── mappers/
│   ├── consumers/
│   └── providers/
│
└── tests/
    ├── unit/
    └── integration/
```

---

# 69. Shared Module Rules

The shared folder may contain only truly reusable technical or domain primitives.

Allowed examples:

* Entity ID
* Money value object
* Result type
* Domain event interface
* Pagination
* Correlation context
* Tenant context
* Base error classes
* Transaction interface

Not allowed:

* Sales-specific helpers
* Procurement-specific validation
* Customer-specific business logic
* Finance-specific posting rules

A large shared folder often becomes hidden coupling.

---

# 70. Frontend Folder Structure

```text
client/
├── package.json
├── vite.config.ts
├── src/
│   ├── app/
│   │   ├── router/
│   │   ├── providers/
│   │   ├── layouts/
│   │   └── store/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── administration/
│   │   ├── crm/
│   │   ├── sales/
│   │   ├── procurement/
│   │   ├── inventory/
│   │   ├── warehouse/
│   │   ├── finance/
│   │   ├── hr/
│   │   └── reporting/
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── api/
│   │   ├── permissions/
│   │   ├── validation/
│   │   └── types/
│   │
│   ├── assets/
│   ├── styles/
│   └── main.tsx
│
└── tests/
```

Each frontend module should contain:

```text
sales/
├── api/
├── components/
├── pages/
├── forms/
├── tables/
├── hooks/
├── schemas/
├── types/
└── utils/
```

---

# 71. Architecture Decision Records

Architecture decisions must be documented using ADRs.

ADR template:

```text
Title
Status
Context
Decision
Alternatives Considered
Consequences
Risks
Review Date
```

---

# 72. ADR-001 — Modular Monolith

## Status

Accepted.

## Context

The ERP contains many business domains, but the initial team and product stage do not justify distributed microservices.

## Decision

Build one deployable backend with strongly isolated internal modules.

## Consequences

Positive:

* Easier deployment
* Strong database transactions
* Lower infrastructure cost
* Easier debugging
* Simpler local development

Negative:

* Requires discipline to preserve boundaries
* One deployment may become large
* Poorly designed modules may become tightly coupled

---

# 73. ADR-002 — PostgreSQL

## Status

Accepted.

## Context

The ERP requires:

* Strong transactions
* Relational integrity
* Financial reporting
* Complex queries
* Multi-tenant records
* Decimal accuracy
* Reliable indexing

## Decision

Use PostgreSQL as the primary transactional database.

## Consequences

* Strong consistency
* Strong relational constraints
* Row-Level Security option
* Good reporting capabilities
* Requires careful migration management and query optimization

---

# 74. ADR-003 — Shared Database Multi-Tenancy

## Status

Accepted for standard SaaS release.

## Decision

Use a shared database with tenant-owned records containing `tenant_id`.

## Additional Controls

* Trusted tenant context
* Repository filtering
* Composite uniqueness
* Database constraints
* Optional Row-Level Security
* Tenant-aware cache and storage

## Consequences

Positive:

* Lower cost
* Easier operations
* Easier tenant onboarding

Negative:

* Isolation defects carry high risk
* Requires extensive automated isolation tests
* Large tenants may later require dedicated databases

---

# 75. ADR-004 — Transactional Outbox

## Status

Accepted.

## Decision

Business changes and outgoing events will be stored in the same database transaction.

## Consequences

* Reliable event publication
* Supports future service extraction
* Requires outbox workers
* Requires retry and cleanup policies

---

# 76. ADR-005 — Ledger-Based Finance

## Status

Accepted and mandatory.

## Decision

Financial balances will be derived from posted journal lines.

Posted entries are corrected through reversals and correcting entries.

## Consequences

* Reliable auditability
* Traceable reports
* More complex than editable balance fields
* Requires disciplined posting services

---

# 77. ADR-006 — Movement-Based Inventory

## Status

Accepted and mandatory.

## Decision

Inventory quantities and values will be derived from controlled stock movements and valuation records.

## Consequences

* Strong traceability
* Supports multiple warehouses
* Supports valuation
* Requires careful performance optimization for high transaction volumes

---

# 78. ADR-007 — REST API First

## Status

Accepted.

## Decision

Use versioned REST APIs for initial frontend and external integrations.

## Consequences

* Familiar design
* Easy tool support
* Clear action endpoints required
* GraphQL may later be considered for selected read-heavy use cases

---

# 79. ADR-008 — Redis and BullMQ

## Status

Accepted.

## Decision

Use Redis for queues, rate limiting, short-lived caches and distributed coordination.

Use BullMQ for background jobs.

## Consequences

* Reliable job processing
* Simple Node.js integration
* Adds operational dependency
* Redis must be highly available in production

---

# 80. ADR-009 — S3-Compatible Storage

## Status

Accepted.

## Decision

Store uploaded files in S3-compatible object storage rather than application local disk.

## Consequences

* Horizontal scalability
* Better backup and access control
* Requires signed access and provider abstraction
* File availability depends on external storage service

---

# 81. ADR-010 — TypeScript Backend

## Status

Accepted.

## Decision

Use TypeScript for backend development.

## Consequences

* Stronger contracts
* Safer refactoring
* Better large-team maintainability
* Requires strict configuration and developer discipline

---

# 82. Security Architecture Summary

```text
Authentication
        ↓
Trusted Session
        ↓
Tenant Context
        ↓
Role and Permission Policy
        ↓
Organization Scope
        ↓
Record and Field Restrictions
        ↓
Business Rule Validation
        ↓
Audit Logging
```

Security must be implemented as multiple layers rather than one middleware check.

---

# 83. MVP Architecture Scope

The MVP architecture must implement:

* Identity
* Tenancy
* Organization
* Authorization
* Workflow
* Audit
* Notifications
* Documents
* Customers
* Suppliers
* CRM basics
* Sales
* Procurement
* Inventory
* Warehouse basics
* Finance
* Payments
* Reporting basics
* Outbox worker
* Background jobs
* Object storage
* Redis
* PostgreSQL

The following may remain future architecture:

* Separate analytical warehouse
* Dedicated tenant databases
* Kafka
* Kubernetes
* Microservices
* Full event streaming
* Complex search engine
* AI infrastructure

---

# 84. Architecture Validation Scenarios

The architecture must successfully support these scenarios.

## Scenario 1 — Tenant Isolation

A user from Tenant A attempts to access a Tenant B sales order by changing the record ID.

Expected result:

```text
Access denied or record not found
No data leakage
Security audit event recorded where appropriate
```

## Scenario 2 — Invoice Posting Failure

A journal line fails validation.

Expected result:

```text
Invoice remains unposted
No partial journal exists
No receivable balance changes
No event is published
```

## Scenario 3 — Event Publication Failure

A sales order is confirmed, but the event worker is temporarily unavailable.

Expected result:

```text
Sales order remains confirmed
Outbox event remains pending
Worker retries later
Event is eventually delivered
```

## Scenario 4 — Duplicate Payment Request

The same mobile-money callback is received twice.

Expected result:

```text
Only one payment is created
Second request returns original result or is ignored
```

## Scenario 5 — Concurrent Stock Reservation

Two users attempt to reserve the final stock unit.

Expected result:

```text
Only one reservation succeeds
The other receives insufficient-stock response
Stock does not become invalid
```

## Scenario 6 — Posted Journal Modification

A user attempts to edit a posted journal.

Expected result:

```text
Direct editing is rejected
User is offered reversal workflow
Attempt is audited
```

---

# 85. Definition of Done for Architecture Phase

The architecture phase is complete when:

* Bounded contexts are approved.
* Module ownership is approved.
* Module dependencies are documented.
* Aggregate boundaries are accepted.
* Multi-tenant data model is accepted.
* Transaction boundaries are defined.
* Domain events are identified.
* Outbox architecture is approved.
* API conventions are approved.
* Authentication and authorization models are approved.
* Background-job design is approved.
* File-storage design is approved.
* Reporting direction is approved.
* Deployment model is approved.
* Folder structure is approved.
* Initial ADRs are accepted.
* Architecture validation scenarios pass during implementation planning.

---

# 86. Architecture Decision Summary

```text
Application Style:
Domain-Oriented Modular Monolith

Backend:
Node.js, TypeScript and NestJS

Frontend:
React and TypeScript

Transactional Database:
PostgreSQL

Queue and Cache:
Redis and BullMQ

Storage:
S3-Compatible Object Storage

Internal Integration:
Application Contracts and Domain Events

Reliable Event Delivery:
Transactional Outbox

Financial Model:
Double-Entry Ledger

Inventory Model:
Stock Movement and Valuation Ledger

Multi-Tenancy:
Shared Database with Tenant Isolation

Authentication:
Short-Lived Access Tokens and Rotating Refresh Tokens

Authorization:
Roles, Permissions, Data Scope and Policies

Deployment:
Stateless API Instances and Separate Workers

Future Evolution:
Extract services only when supported by operational evidence
```

---

# 87. Next Documentation Stage

## Part 4: Database Domain Model and Entity Relationship Design

The next document will define:

1. Database naming conventions
2. Common base fields
3. Tenant and organization tables
4. Identity and authorization tables
5. Customer and supplier tables
6. Product and pricing tables
7. CRM tables
8. Sales tables
9. Procurement tables
10. Inventory tables
11. Warehouse tables
12. Accounting tables
13. Payment tables
14. Workflow tables
15. Audit tables
16. Notification tables
17. Document tables
18. Relationships and foreign keys
19. Unique constraints
20. Indexes
21. Ledger structures
22. ERD overview
23. MVP database scope
