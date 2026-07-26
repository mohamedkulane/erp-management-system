# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 11: Implementation Roadmap, Epics, Milestones and Codex Development Plan

**Document Status:** Initial Implementation Roadmap
**Architecture:** Multi-Tenant Modular Monolith
**Development Approach:** Incremental, vertical-slice and test-driven delivery
**Primary Development Tool:** Codex-assisted implementation
**Main Goal:** Produce a complete, demonstrable and production-oriented ERP foundation without attempting all modules simultaneously.

---

# 1. Purpose

This document defines:

* What should be built first
* Which modules depend on others
* How work is divided into phases
* Which epics belong to the MVP
* Which user stories should be sent to Codex
* Acceptance criteria
* Milestones
* Release boundaries
* Scope exclusions
* Codex task workflow
* Completion standards

This roadmap is the primary implementation guide.

---

# 2. Implementation Philosophy

The platform will be developed through complete vertical business slices.

A vertical slice includes:

* Database
* Domain model
* Application use case
* API
* Authorization
* Audit
* Tests
* Frontend
* Documentation

Avoid implementing:

```text
All database tables first
→ All APIs later
→ All frontend pages last
```

Preferred:

```text
Customer creation
→ Database
→ Backend
→ API
→ Security
→ Tests
→ Frontend
→ Acceptance
```

---

# 3. Primary Implementation Rule

Do not ask Codex to build the entire ERP in one task.

Every task must have:

* One clear outcome
* Relevant document references
* Explicit exclusions
* Acceptance criteria
* Testing requirements
* Files or modules in scope
* Completion commands

---

# 4. Target Initial Product

The first complete commercial core should support:

```text
Tenant setup
→ Company setup
→ User access
→ Product setup
→ Customer setup
→ Supplier setup
→ Sales
→ Inventory
→ Procurement
→ Accounting
→ Payments
→ Reports
```

The MVP must demonstrate two complete business flows:

## Lead-to-Cash

```text
Customer
→ Sales Order
→ Stock Reservation
→ Delivery
→ Customer Invoice
→ Customer Payment
→ Journal Entries
```

## Procure-to-Pay

```text
Supplier
→ Purchase Order
→ Goods Receipt
→ Supplier Invoice
→ Supplier Payment
→ Journal Entries
```

---

# 5. Delivery Phases

Recommended phases:

```text
Phase 0: Repository and Engineering Foundation
Phase 1: Identity, Tenancy and Organization
Phase 2: Authorization, Audit and Workflow Foundation
Phase 3: Product, Customer and Supplier Master Data
Phase 4: Sales and Inventory Foundation
Phase 5: Lead-to-Cash Completion
Phase 6: Procurement and Procure-to-Pay
Phase 7: Finance Maturity and Reporting
Phase 8: Production Readiness
Phase 9: Future ERP Expansion
```

---

# 6. Phase 0 — Repository and Engineering Foundation

## Goal

Create a reliable development environment before implementing business modules.

## Epic 0.1 — Monorepo Setup

Deliver:

* Root workspace
* `client/`
* `server/`
* `docs/`
* `infrastructure/`
* `scripts/`
* Shared commands
* Root README

Acceptance criteria:

* One install command works.
* Frontend and backend start.
* Workspace scripts work.
* TypeScript strict mode is enabled.

## Epic 0.2 — Backend Foundation

Deliver:

* NestJS application
* Configuration validation
* Global error handling
* Request correlation IDs
* Structured logging
* API versioning
* Health endpoints

## Epic 0.3 — Frontend Foundation

Deliver:

* React and Vite
* Routing
* App providers
* API client
* Base layout
* Error boundary
* Authentication placeholders
* Design-system foundation

## Epic 0.4 — Infrastructure Foundation

Deliver:

* Docker Compose
* PostgreSQL
* Redis
* MinIO
* Mail testing server
* API container
* Worker container

## Epic 0.5 — Quality Foundation

Deliver:

* Linting
* Formatting
* Unit testing
* Integration testing
* Frontend testing
* CI pipeline
* Pre-commit standards where appropriate

## Milestone 0

```text
Repository starts with one command.
Health checks pass.
CI passes.
Frontend can call backend.
```

---

# 7. Phase 1 — Identity, Tenancy and Organization

## Goal

Create secure tenant-aware application access.

## Epic 1.1 — Tenant Management

Stories:

* Create tenant
* View tenant
* Update tenant settings
* Suspend tenant
* Reactivate tenant
* Enable tenant modules

Acceptance criteria:

* Tenant code is unique.
* Tenant status is enforced.
* Audit event is recorded.
* Suspended tenant cannot access business functions.

## Epic 1.2 — User Authentication

Stories:

* User invitation
* Account activation
* Login
* Refresh token
* Logout
* Password reset
* Session listing
* Session revocation

Acceptance criteria:

* Passwords are securely hashed.
* Refresh tokens rotate.
* Suspended users cannot authenticate.
* Session reuse rules are tested.

## Epic 1.3 — Organization Structure

Stories:

* Create company
* Create branch
* Create department
* Create cost center
* Configure base currency
* Configure fiscal year
* Configure fiscal period

## Epic 1.4 — Context Switching

Stories:

* Tenant switch
* Company switch
* Branch switch
* Cache invalidation
* Context display in frontend

## Milestone 1

```text
A user can log in to one tenant,
select an authorized company and branch,
and access a tenant-isolated workspace.
```

---

# 8. Phase 2 — Authorization, Audit and Workflow Foundation

## Goal

Ensure every future module can use secure reusable platform capabilities.

## Epic 2.1 — Roles and Permissions

Stories:

* Create role
* Assign permission
* Assign role to user
* Set company scope
* Set branch scope
* Revoke role
* Permission cache invalidation

## Epic 2.2 — Authorization Policies

Stories:

* Resource permission guard
* Company-scope policy
* Branch-scope policy
* Record-owner policy
* Approval-limit policy
* Field-level access

## Epic 2.3 — Audit Logging

Stories:

* Business audit event
* Security audit event
* Administrative audit event
* Audit search
* Record history
* Sensitive-field masking

## Epic 2.4 — Workflow Engine Foundation

Stories:

* Workflow definition
* Workflow version
* Approval step
* Workflow instance
* Approval task
* Approve
* Reject
* Return
* Delegate
* Approval history

## Epic 2.5 — Notifications Foundation

Stories:

* In-app notification
* Email queue
* Notification template
* User preferences
* Delivery tracking

## Milestone 2

```text
Users have role-based access.
Sensitive actions are audited.
A reusable approval workflow is operational.
```

---

# 9. Phase 3 — Master Data Foundation

## Goal

Create the master records required by commercial transactions.

## Epic 3.1 — Party Foundation

Stories:

* Create party
* Add contact
* Add address
* Search party
* Detect duplicate party

## Epic 3.2 — Customer Management

Stories:

* Create customer
* Assign customer number
* Customer group
* Billing address
* Shipping address
* Payment terms
* Credit profile
* Customer approval
* Credit block
* Customer 360 summary

## Epic 3.3 — Supplier Management

Stories:

* Create supplier
* Supplier category
* Supplier contact
* Supplier approval
* Payment terms
* Bank account
* Bank-change approval
* Supplier suspension

## Epic 3.4 — Product Master

Stories:

* Create product
* Product category
* Unit of measure
* UOM conversion
* Barcode
* Product status
* Tracking method
* Costing method
* Accounting configuration

## Epic 3.5 — Pricing

Stories:

* Create price list
* Add price-list item
* Effective dates
* Customer price list
* Discount rule
* Approval-required discount

## Epic 3.6 — Warehouses

Stories:

* Create warehouse
* Create location
* Configure receiving location
* Configure picking location
* Configure quarantine location
* Warehouse access scope

## Milestone 3

```text
A tenant can configure customers, suppliers,
products, prices, units and warehouses.
```

---

# 10. Phase 4 — Sales and Inventory Foundation

## Goal

Implement order creation and reliable stock control.

## Epic 4.1 — Sales Quotations

Stories:

* Create quotation
* Add lines
* Calculate prices
* Calculate discounts
* Calculate tax
* Submit quotation
* Approve quotation
* Accept quotation
* Revise quotation
* Convert quotation to order

## Epic 4.2 — Sales Orders

Stories:

* Create sales order
* Create from quotation
* Add lines
* Validate customer
* Check credit
* Submit
* Approve
* Confirm
* Place on hold
* Cancel
* Close remaining quantity

## Epic 4.3 — Inventory Opening Balance

Stories:

* Create opening-stock batch
* Add opening quantities
* Add opening values
* Approve
* Post stock movements
* Verify balances

## Epic 4.4 — Stock Balance Projection

Stories:

* Quantity on hand
* Reserved quantity
* Available quantity
* Incoming quantity
* Quarantine quantity
* Rebuild projection

## Epic 4.5 — Stock Reservations

Stories:

* Request reservation
* Full reservation
* Partial reservation
* Reservation failure
* Reservation release
* Reservation expiration
* Concurrency protection

## Milestone 4

```text
A sales order can be created, approved,
confirmed and safely reserve stock.
```

---

# 11. Phase 5 — Lead-to-Cash Completion

## Goal

Complete the first full enterprise business process.

## Epic 5.1 — Warehouse Picking

Stories:

* Create pick task
* Assign task
* Start picking
* Scan product
* Scan location
* Capture lot or serial
* Record short pick
* Complete picking

## Epic 5.2 — Packing and Delivery

Stories:

* Create package
* Add package lines
* Mark packed
* Ship delivery
* Confirm delivery
* Post delivery
* Reverse delivery

## Epic 5.3 — Inventory Costing

Stories:

* FIFO cost
* Weighted-average cost
* Valuation layer
* Cost of goods sold
* Reversal valuation

Recommended initial implementation:

```text
Weighted Average
```

FIFO can follow when the base flow is stable.

## Epic 5.4 — Customer Invoices

Stories:

* Create from delivery
* Calculate totals
* Submit
* Approve
* Post
* Generate journal
* Track outstanding amount
* Reverse invoice

## Epic 5.5 — Customer Payments

Stories:

* Create receipt
* Approve receipt
* Post receipt
* Allocate to invoice
* Partial allocation
* Full allocation
* Customer advance
* Payment reversal

## Epic 5.6 — Customer Credit Notes and Returns

Stories:

* Return request
* Return authorization
* Receive returned product
* Inspect
* Post return
* Create credit note
* Allocate credit

## Epic 5.7 — Lead-to-Cash Reports

Deliver:

* Sales-order status
* Delivery status
* Customer invoices
* Receivables aging
* Customer statement
* Sales margin
* Inventory movement

## Milestone 5 — MVP Business Flow One

```text
Customer
→ Sales Order
→ Reservation
→ Delivery
→ Invoice
→ Payment
→ Accounting
```

Acceptance requirement:

* Full flow works through frontend.
* Stock and accounting reconcile.
* All critical tests pass.

---

# 12. Phase 6 — Procurement and Procure-to-Pay

## Goal

Complete purchasing, receiving, supplier invoices and payment.

## Epic 6.1 — Purchase Requests

Stories:

* Create request
* Add lines
* Department and cost center
* Submit
* Approve
* Reject
* Convert to RFQ or purchase order

## Epic 6.2 — RFQ and Supplier Quotations

Stories:

* Create RFQ
* Invite suppliers
* Enter supplier quotation
* Compare prices
* Compare delivery
* Award supplier

This epic may be deferred until after basic purchase orders if schedule requires.

## Epic 6.3 — Purchase Orders

Stories:

* Create order
* Create from request
* Add lines
* Validate supplier
* Submit
* Approve
* Send
* Amend
* Cancel remaining
* Close

## Epic 6.4 — Goods Receipts

Stories:

* Create from purchase order
* Receive partial quantity
* Lot and serial capture
* Accept
* Reject
* Quarantine
* Post receipt
* Put away
* Reverse receipt

## Epic 6.5 — Supplier Invoices

Stories:

* Create invoice
* Duplicate check
* Match purchase order
* Match goods receipt
* Detect variance
* Approve exception
* Post invoice
* Reverse invoice

## Epic 6.6 — Supplier Payments

Stories:

* Create payment
* Validate bank details
* Submit
* Approve
* Post
* Allocate
* Supplier advance
* Reverse

## Epic 6.7 — Supplier Returns

Stories:

* Create return
* Approve
* Pick returned stock
* Post stock reduction
* Supplier debit note
* Complete return

## Epic 6.8 — Procure-to-Pay Reports

Deliver:

* Purchase commitments
* Expected receipts
* Supplier invoices
* Payables aging
* Supplier statement
* Purchase-price variance
* Supplier performance

## Milestone 6 — MVP Business Flow Two

```text
Supplier
→ Purchase Order
→ Goods Receipt
→ Supplier Invoice
→ Supplier Payment
→ Accounting
```

---

# 13. Phase 7 — Finance Maturity and Reporting

## Goal

Turn the operational system into a reliable accounting platform.

## Epic 7.1 — Chart of Accounts

Stories:

* Account types
* Account hierarchy
* Posting accounts
* Control accounts
* Account activation
* Account validation

## Epic 7.2 — General Ledger

Stories:

* Manual journal
* Approval
* Posting
* Reversal
* Source-document navigation
* Ledger inquiry
* Account balance

## Epic 7.3 — Fiscal Period Management

Stories:

* Open period
* Soft close
* Close
* Lock
* Reopen
* Posting restrictions

## Epic 7.4 — Bank and Cash

Stories:

* Bank accounts
* Cash accounts
* Bank statement import
* Matching
* Reconciliation
* Bank charges
* Interest
* Cash transfer

## Epic 7.5 — Financial Reports

Deliver:

* Trial balance
* General ledger
* Income statement
* Balance sheet
* Cash flow foundation
* Receivables aging
* Payables aging
* Tax report

## Epic 7.6 — Multi-Currency

Stories:

* Exchange rate
* Foreign-currency invoice
* Foreign-currency payment
* Realized gain or loss
* Revaluation foundation

## Milestone 7

```text
Operational transactions produce reliable
double-entry accounting and core financial statements.
```

---

# 14. Phase 8 — Production Readiness

## Goal

Prepare the ERP for a real controlled deployment.

## Epic 8.1 — Security Hardening

Deliver:

* MFA
* Session management
* Privileged-action reauthentication
* File scanning
* Rate limiting
* Security monitoring
* Access reviews

## Epic 8.2 — Observability

Deliver:

* Structured logs
* Metrics
* Correlation IDs
* Queue dashboard
* Slow-query monitoring
* Error tracking
* Alerts

## Epic 8.3 — Backup and Recovery

Deliver:

* Automated backups
* Point-in-time recovery
* Restore test
* File recovery
* Integrity-verification scripts

## Epic 8.4 — CI/CD

Deliver:

* Staging deployment
* Production deployment
* Migration pipeline
* Smoke tests
* Rollback process
* Release notes

## Epic 8.5 — Performance

Deliver:

* Query optimization
* Index review
* API load test
* Queue load test
* Frontend optimization
* Export performance

## Epic 8.6 — Operational Documentation

Deliver:

* Admin guide
* Deployment guide
* Backup guide
* Incident runbooks
* Support workflow
* User guide for core roles

## Milestone 8 — Version 1.0

The platform is ready for:

* Portfolio demonstration
* Controlled pilot
* Small real business deployment
* Continued commercial development

---

# 15. Future Phase 9 — ERP Expansion

Future modules:

* Advanced CRM
* Human resources
* Attendance
* Leave
* Payroll
* Fixed assets
* Budgeting
* Projects
* Timesheets
* Manufacturing
* Bill of materials
* Production planning
* Maintenance
* Quality
* Customer service
* Advanced analytics
* Mobile applications

These should not block the commercial-core MVP.

---

# 16. Recommended MVP Scope

The initial MVP includes:

* Identity
* Tenancy
* Organization
* Roles and permissions
* Audit
* Basic workflow
* Notifications
* Customers
* Suppliers
* Products
* Pricing
* Warehouses
* Sales orders
* Stock reservations
* Deliveries
* Customer invoices
* Customer payments
* Purchase orders
* Goods receipts
* Supplier invoices
* Supplier payments
* General ledger
* Core reports

---

# 17. Explicit MVP Exclusions

Do not include initially:

* Full manufacturing
* Payroll
* Advanced HR
* Fixed assets
* AI forecasting
* Complex demand planning
* Multi-region deployment
* Microservices
* Kubernetes
* Full offline financial posting
* Highly customizable workflow designer UI
* Country-specific tax engine for many countries
* Native mobile applications

Exclusions prevent uncontrolled scope growth.

---

# 18. Dependency Order

Recommended dependency chain:

```text
Repository Foundation
↓
Identity and Tenancy
↓
Organization
↓
Authorization and Audit
↓
Workflow
↓
Master Data
↓
Products and Warehouses
↓
Sales and Reservations
↓
Delivery and Inventory Costing
↓
Customer Finance
↓
Procurement and Receiving
↓
Supplier Finance
↓
Financial Reporting
↓
Production Hardening
```

---

# 19. Codex Repository Documentation Structure

Recommended:

```text
docs/
├── index.md
├── product/
│   ├── vision.md
│   └── business-requirements.md
├── architecture/
│   ├── system-architecture.md
│   ├── frontend-architecture.md
│   └── infrastructure.md
├── database/
│   └── domain-model.md
├── security/
│   └── security-design.md
├── api/
│   └── api-event-design.md
├── workflows/
│   └── business-workflows.md
├── testing/
│   └── testing-strategy.md
├── roadmap/
│   ├── implementation-roadmap.md
│   ├── current-phase.md
│   └── epics/
└── decisions/
    └── ADRs.md
```

---

# 20. Current Phase Document

`docs/roadmap/current-phase.md` should contain only active implementation scope.

Example:

```text
Current Phase: Phase 1

Active Epic:
User Authentication

Current Story:
Implement login and rotating refresh-token sessions.

Out of Scope:
MFA
Social login
External identity providers
```

This keeps Codex focused.

---

# 21. Epic Specification Template

Each epic file should include:

```text
Epic Name
Business Goal
Dependencies
In Scope
Out of Scope
User Stories
Business Rules
Database Impact
API Impact
Security Requirements
Events
Testing Requirements
Acceptance Criteria
Definition of Done
```

---

# 22. User Story Template

```text
Story ID:
Title:

As a:
I want:
So that:

Requirements:
Business Rules:
Authorization:
Database Changes:
API:
Frontend:
Audit:
Events:
Tests:
Acceptance Criteria:
Out of Scope:
```

---

# 23. Example Codex Story

## Story ID

`TEN-001`

## Title

Create Tenant

## Requirements

* Create tenant aggregate.
* Generate tenant UUID.
* Validate unique tenant code.
* Default status is `TRIAL`.
* Create default tenant settings.
* Record audit event.

## API

```text
POST /api/v1/platform/tenants
```

## Authorization

Only platform administrator may create tenants.

## Tests

* Successful creation
* Duplicate code
* Unauthorized user
* Validation
* Audit event
* Database integration

## Out of Scope

* Subscription payment
* Tenant branding
* Custom domain

---

# 24. Codex Task Prompt Structure

Use prompts like:

```text
Read:

- AGENTS.md
- docs/index.md
- docs/architecture/system-architecture.md
- docs/testing/testing-strategy.md
- docs/roadmap/epics/TEN-001-create-tenant.md

Implement only TEN-001.

Do not implement subscription billing or tenant branding.

Before coding:
1. Inspect the repository.
2. Summarize the requirements.
3. Identify files to change.
4. Identify database migration.
5. Identify tests.
6. Report conflicts with existing architecture.

Then implement the story.

Before completion:
- Run lint
- Run typecheck
- Run relevant unit tests
- Run relevant integration tests
- Update documentation if contracts changed
```

---

# 25. One-Story-at-a-Time Rule

Codex should normally implement one story per task.

Small related technical stories may be grouped only when they form one atomic outcome.

Good grouping:

```text
Create login endpoint
+ create session
+ issue tokens
```

Bad grouping:

```text
Build authentication, tenants, sales, inventory and accounting
```

---

# 26. Planning Before Coding

For complex stories, first ask Codex to produce:

* Understanding
* Implementation plan
* Files affected
* Database impact
* Security impact
* Test plan
* Risks

Then issue the implementation request after reviewing the plan.

---

# 27. Story Completion Gate

Do not move to the next story until:

* Acceptance criteria pass.
* Tests pass.
* No architecture rule is violated.
* Database migration is reviewed.
* Security checks exist.
* Audit requirements are met.
* Documentation is current.
* Code is committed.

---

# 28. Recommended Git Strategy

Initial strategy:

```text
main
develop or short-lived feature branches
```

Feature branch examples:

```text
feature/TEN-001-create-tenant
feature/AUTH-003-login
fix/INV-021-reservation-race
```

Prefer short-lived branches.

---

# 29. Commit Message Convention

Examples:

```text
feat(tenancy): add tenant creation
feat(auth): implement rotating refresh tokens
fix(inventory): prevent duplicate reservation
test(finance): add journal reversal integration tests
docs(api): document invoice posting endpoint
```

---

# 30. Pull Request Requirements

Each pull request should state:

* Story ID
* Summary
* Business behaviour
* Database changes
* Security impact
* Tests added
* Screenshots where relevant
* Known limitations
* Documentation changes

---

# 31. Milestone Review

At the end of each milestone:

1. Run complete relevant test suite.
2. Demonstrate user workflow.
3. Review architecture boundaries.
4. Review database integrity.
5. Review security.
6. Review performance.
7. Review defects.
8. Update roadmap.
9. Record decisions.
10. Tag milestone version.

---

# 32. Architecture Review Checkpoints

Architecture review should occur after:

* Platform foundation
* Master data
* Sales and reservations
* Finance posting
* Procurement
* Production readiness

Check:

* Module coupling
* Shared-folder growth
* Repository ownership
* Transaction boundaries
* Tenant enforcement
* Event usage
* Performance
* Technical debt

---

# 33. Technical Debt Management

Technical debt should be recorded with:

* Description
* Reason accepted
* Risk
* Affected module
* Target resolution
* Priority

Do not hide major incomplete work inside comments.

Avoid:

```text
TODO: implement proper accounting later
```

inside production transaction paths.

---

# 34. Placeholder Policy

Temporary placeholders are allowed only when:

* Clearly identified
* Not used for critical business behaviour
* Covered by explicit backlog item
* Safe for current milestone

Not allowed as final implementations:

* Fake payment success
* Hardcoded tenant
* Editable posted journal
* Direct stock quantity update
* Frontend-only authorization
* Unbalanced accounting placeholder

---

# 35. Demo Strategy

Each milestone should include a demonstration script.

## Milestone 1 Demo

* Create tenant
* Invite user
* Login
* Select company

## Milestone 5 Demo

* Create customer
* Create sales order
* Reserve stock
* Deliver
* Invoice
* Receive payment
* Show journal and reports

## Milestone 6 Demo

* Create supplier
* Create purchase order
* Receive stock
* Post supplier invoice
* Pay supplier

---

# 36. Portfolio Evidence

The completed project should include:

* Architecture documentation
* ERD
* ADRs
* API documentation
* Test reports
* CI/CD pipeline
* Docker setup
* Security design
* Demo video
* Seeded demo tenant
* Screenshots
* Deployment
* Business workflow explanation

This proves engineering ability beyond visual design.

---

# 37. Progress Metrics

Track:

* Stories completed
* Tests passing
* Critical workflow completion
* Open defects
* Test coverage for critical rules
* Performance targets
* Deployment success
* Documentation completeness

Avoid judging progress only by number of files or modules.

---

# 38. Timeline Guidance

Do not set one fixed unrealistic deadline for the entire ERP.

Use milestone-based planning.

Suggested learning and implementation order:

```text
Foundation
→ Platform Security
→ Master Data
→ Lead-to-Cash
→ Procure-to-Pay
→ Financial Maturity
→ Production Readiness
```

The most important target is completing one reliable flow before expanding.

---

# 39. Risks

Major risks:

* Scope expansion
* Accounting misunderstanding
* Weak tenant isolation
* Too many modules started
* Insufficient tests
* Codex-generated placeholder logic
* Architecture drift
* Poor database migrations
* Lack of real deployment
* Incomplete business workflows

---

# 40. Risk Controls

Use:

* Explicit scope
* Story templates
* Acceptance criteria
* One-story tasks
* Automated tests
* Architecture reviews
* ADRs
* Production-like staging
* Demo checkpoints
* Regular roadmap updates

---

# 41. Final MVP Acceptance

The MVP is accepted when both business flows work.

## Lead-to-Cash

* Customer approved
* Sales order confirmed
* Stock reserved
* Delivery posted
* Invoice posted
* Payment allocated
* Journals balanced
* Reports updated

## Procure-to-Pay

* Supplier approved
* Purchase order approved
* Goods receipt posted
* Supplier invoice matched
* Supplier payment posted
* Journals balanced
* Reports updated

## Platform

* Tenant isolation passes
* Authorization passes
* Audit exists
* Backups exist
* CI/CD works
* Core documentation exists

---

# 42. Implementation Decision Summary

```text
Development Model:
Incremental vertical slices

Primary MVP:
Lead-to-Cash and Procure-to-Pay

Architecture:
Multi-tenant modular monolith

Codex Usage:
One scoped story at a time

Quality:
Tests, security, audit and documentation required

Sequence:
Foundation → Platform → Master Data → Sales → Inventory
→ Finance → Procurement → Production Readiness

Completion:
Business behaviour, not file quantity

Future Modules:
Added only after commercial core is reliable
```

---

# 43. Immediate Next Actions

1. Create the repository structure.
2. Add `AGENTS.md`.
3. Add `docs/index.md`.
4. Save Parts 1–11 into organized documentation files.
5. Create `docs/roadmap/current-phase.md`.
6. Create the first Phase 0 epic files.
7. Give Codex only the first foundation story.
8. Require tests and validation before the next task.
