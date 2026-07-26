# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 10: Testing Strategy, Quality Assurance and Release Validation

**Document Status:** Initial Testing and Quality Strategy
**Architecture:** Multi-Tenant Modular Monolith
**Backend:** Node.js, TypeScript and NestJS
**Frontend:** React and TypeScript
**Database:** PostgreSQL
**Queue and Cache:** Redis and BullMQ
**Primary Goal:** Ensure that every business transaction is secure, consistent, testable and production-ready.

---

# 1. Purpose

This document defines how the ERP platform will be tested and validated.

It establishes:

* Testing levels
* Test responsibilities
* Domain-rule testing
* Database testing
* API testing
* Multi-tenant isolation testing
* Authorization testing
* Finance and inventory testing
* Workflow testing
* Frontend testing
* Integration testing
* Reliability testing
* Performance testing
* Security testing
* Release quality gates
* User acceptance testing
* Definition of Done

Testing is mandatory because the ERP manages:

* Money
* Inventory
* Payments
* Customer credit
* Supplier obligations
* Approval authority
* Tenant data
* Audit evidence

A feature is not complete merely because the user interface appears to work.

---

# 2. Testing Objectives

The testing strategy must prove that:

1. Business rules behave correctly.
2. Tenant data remains isolated.
3. Permissions cannot be bypassed.
4. Financial transactions remain balanced.
5. Inventory transactions remain traceable.
6. Posted transactions cannot be directly modified.
7. Duplicate requests do not create duplicate effects.
8. Workflows follow approved state transitions.
9. APIs return stable contracts.
10. Background jobs recover from temporary failures.
11. Releases do not break existing workflows.
12. The platform can be safely deployed and recovered.

---

# 3. Testing Principles

## 3.1 Test Business Behaviour, Not Only Code Structure

Weak test:

```text
The controller method was called.
```

Strong test:

```text
A credit-blocked customer cannot confirm a credit sales order.
```

## 3.2 Important Rules Must Have Automated Tests

Critical rules must not depend entirely on manual testing.

Examples:

* Debit equals credit.
* Stock cannot be reserved twice.
* Tenant A cannot access Tenant B.
* Closed fiscal periods reject postings.
* Duplicate payment callbacks create only one payment.
* Posted journals cannot be edited.

## 3.3 Tests Must Be Deterministic

Tests should not fail randomly because of:

* Current time
* External network
* Shared mutable data
* Uncontrolled test order
* Random asynchronous delays

Use:

* Fixed clocks
* Controlled IDs
* Test factories
* Mock providers
* Isolated databases
* Deterministic queue processing

## 3.4 Production Defects Require Regression Tests

Every confirmed defect should result in:

1. A test that reproduces the defect
2. The code correction
3. Proof that the test passes
4. Related documentation update where required

## 3.5 High-Risk Modules Need Stronger Coverage

Higher testing requirements apply to:

* Finance
* Payments
* Inventory
* Payroll
* Authentication
* Authorization
* Multi-tenancy
* Workflow approvals
* External integrations

---

# 4. Testing Pyramid

Recommended structure:

```text
                 End-to-End Tests
              Contract and API Tests
           Integration and Repository Tests
              Domain and Unit Tests
```

Most tests should be fast domain and unit tests.

A smaller number should be full end-to-end tests.

---

# 5. Test Categories

The project will use:

* Unit tests
* Domain tests
* Application-service tests
* Repository integration tests
* Database-constraint tests
* API tests
* Contract tests
* Event tests
* Queue and worker tests
* Frontend component tests
* Frontend integration tests
* End-to-end tests
* Tenant-isolation tests
* Authorization tests
* Security tests
* Performance tests
* Reliability tests
* Backup and recovery tests
* User acceptance tests

---

# 6. Unit Testing

Unit tests validate small pieces of logic without real infrastructure.

Examples:

* Money calculations
* Tax calculations
* Quantity conversions
* Due-date calculation
* Discount rules
* Credit exposure formulas
* Status transitions
* Permission policy decisions
* Document-number formatting
* Exchange-rate calculations

Recommended tools:

```text
Vitest or Jest
```

---

# 7. Domain Model Testing

Domain tests should validate aggregates, entities, value objects and policies.

## 7.1 Sales Order Tests

Test:

* Order requires at least one line.
* Quantity must be positive.
* Confirmed order cannot be directly edited.
* Cancelled order cannot be delivered.
* Credit-blocked customer cannot confirm order.
* Discount exceeding authority requires approval.
* Total is recalculated correctly.

## 7.2 Purchase Order Tests

Test:

* Supplier must be approved.
* Quantity must be positive.
* Approved order requires controlled amendment.
* Cancelled order cannot receive goods.
* Over-budget order requires override approval.

## 7.3 Journal Entry Tests

Test:

* Total debit equals total credit.
* One line cannot contain both debit and credit.
* Posting account must be active.
* Posted journal cannot be changed.
* Reversal creates opposite lines.
* Closed period prevents posting.

## 7.4 Stock Movement Tests

Test:

* Movement quantity must be positive.
* Serial number must be unique.
* Lot is required for lot-tracked products.
* Transfer source and destination must differ.
* Posted movement cannot be edited.
* Reversal produces an opposite movement.

---

# 8. Value Object Testing

## Money

Test:

* Addition with same currency succeeds.
* Addition with different currencies fails.
* Decimal precision is preserved.
* Negative values follow business rules.

## Quantity

Test:

* Unit conversion is correct.
* Invalid conversion is rejected.
* Decimal restrictions are respected.

## Date Range

Test:

* End date cannot precede start date.
* Period overlap is detected where required.

## Document Number

Test:

* Prefix is correct.
* Sequence padding is correct.
* Fiscal-year reset is correct.

---

# 9. Application-Service Testing

Application tests validate use cases and orchestration.

Examples:

```text
CreateSalesOrder
ConfirmSalesOrder
PostCustomerInvoice
ReceiveCustomerPayment
ApprovePurchaseOrder
PostGoodsReceipt
ReverseJournalEntry
```

Test:

* Authorization is checked.
* Correct repositories are called.
* Domain rules execute.
* Transaction is used.
* Audit event is created.
* Outbox event is added.
* Failure rolls back all changes.

---

# 10. Repository Integration Testing

Repository tests use a real PostgreSQL test database.

Test:

* Records are persisted correctly.
* Tenant filters are applied.
* Relationships are loaded correctly.
* Optimistic concurrency works.
* Transactions roll back correctly.
* Database types preserve precision.
* Unique constraints work.
* Foreign keys work.
* Row-Level Security works where enabled.

Mocks must not replace all repository integration testing.

---

# 11. Database Constraint Testing

Important database constraints require direct tests.

Examples:

* Duplicate product code in one tenant is rejected.
* Same product code in different tenants is allowed.
* Duplicate serial number is rejected.
* Journal line cannot contain negative debit.
* Invalid foreign key is rejected.
* Cross-tenant composite foreign key is rejected.
* Duplicate idempotency key is rejected.
* Duplicate processed event is rejected.

---

# 12. Tenant Isolation Testing

Tenant-isolation testing is mandatory for every tenant-owned module.

## 12.1 Read Isolation

Tenant A cannot:

* Read Tenant B customer
* Search Tenant B product
* Open Tenant B invoice
* Download Tenant B file
* View Tenant B audit event

## 12.2 Write Isolation

Tenant A cannot:

* Update Tenant B customer
* Confirm Tenant B order
* Post Tenant B invoice
* Delete Tenant B draft
* Assign Tenant B user role

## 12.3 Indirect Isolation

Test tenant isolation in:

* Exports
* Reports
* Caches
* Search
* Background jobs
* Notifications
* WebSockets
* Object storage
* Audit logs

## 12.4 Test Pattern

Every tenant-owned API test should include:

```text
Valid tenant access
Wrong tenant access
Missing tenant context
Suspended tenant
```

---

# 13. Authorization Testing

Authorization tests must verify backend enforcement.

Test:

* User without permission cannot call endpoint directly.
* Hidden UI button does not grant permission.
* Company-level user cannot access another company.
* Branch user cannot access another branch.
* Creator cannot approve own payment where prohibited.
* Approval limit is enforced.
* Delegation is valid only during active dates.
* Field-level permission masks sensitive data.
* Tenant administrator does not automatically see payroll.

---

# 14. Segregation-of-Duties Testing

Examples:

## Payment

```text
Creator attempts to approve same payment.
Expected: rejected.
```

## Journal

```text
Journal preparer attempts to post journal.
Expected: rejected when policy requires separate poster.
```

## Inventory Count

```text
Counter attempts to approve own variance.
Expected: rejected.
```

## Supplier Bank Details

```text
User requests and approves same bank change.
Expected: rejected.
```

---

# 15. Authentication Testing

Test:

* Valid login
* Invalid password
* Locked account
* Suspended account
* Expired invitation
* Password reset
* Reset-token reuse
* Access-token expiration
* Refresh-token rotation
* Reused refresh token
* Session revocation
* MFA verification
* Recovery-code use
* Concurrent-session policy
* Logout from all devices

---

# 16. API Testing

Every API endpoint should test:

* Authentication
* Authorization
* Valid request
* Invalid request
* Business-rule failure
* Resource not found
* Cross-tenant request
* Conflict
* Expected response schema
* Correlation ID
* Audit effect where required

---

# 17. API Contract Testing

Contract tests verify stable request and response formats.

Test:

* Required fields
* Optional fields
* Enum values
* Error format
* Pagination metadata
* Date formatting
* Money formatting
* API version
* Deprecated fields
* Idempotency requirements

Generated OpenAPI schema should be validated in CI.

---

# 18. Event Testing

Domain event tests verify:

* Correct event type
* Correct version
* Correct aggregate ID
* Tenant and company context
* Correlation and causation IDs
* Required payload
* No unnecessary sensitive data

---

# 19. Transactional Outbox Testing

Test:

## Successful Transaction

* Business change commits.
* Outbox event is stored.
* Worker publishes event.
* Event becomes published.

## Business Failure

* Business change rolls back.
* No outbox event exists.

## Publisher Failure

* Business change remains committed.
* Event remains pending.
* Retry occurs.

## Duplicate Processing

* Consumer processes event once.

---

# 20. Event Ordering Testing

Test:

```text
SalesOrderConfirmed version 4
SalesOrderCancelled version 5
Confirmed event arrives after cancelled event
```

Expected:

* Consumer does not reopen cancelled order.
* Stale event is ignored or recorded safely.

---

# 21. Background Job Testing

Test:

* Job completes successfully.
* Temporary failure retries.
* Non-retryable failure dead-letters.
* Tenant context is preserved.
* Duplicate execution is safe.
* Job timeout is enforced.
* Progress is recorded.
* Job cancellation works where allowed.
* Failed job generates alert.

---

# 22. Finance Testing Strategy

Finance requires particularly strict testing.

## 22.1 Journal Testing

Test:

* Debit equals credit.
* Base-currency debit equals base-currency credit.
* Posting date belongs to open period.
* Account allows posting.
* Required dimensions exist.
* Reversal links original journal.
* Posted journal is immutable.

## 22.2 Customer Invoice Testing

Test:

* Correct receivable posting
* Correct revenue posting
* Correct tax posting
* Correct outstanding amount
* Partial payment
* Full payment
* Credit note
* Reversal
* Foreign currency
* Closed period

## 22.3 Supplier Invoice Testing

Test:

* Accounts payable posting
* Recoverable tax
* GRNI clearing
* Price variance
* Quantity variance
* Duplicate supplier invoice
* Three-way match
* Exception approval

## 22.4 Payment Testing

Test:

* Cash receipt
* Bank receipt
* Supplier payment
* Customer advance
* Supplier advance
* Partial allocation
* Over-allocation rejection
* Duplicate callback
* Payment reversal

---

# 23. Accounting Invariant Tests

The following invariants should run across generated test scenarios:

```text
Every posted journal balances.
Every posted invoice has one valid journal.
Every posted payment has one valid journal.
Every reversal references the original transaction.
Receivable balances reconcile with invoices and allocations.
Payable balances reconcile with supplier invoices and payments.
```

Property-based testing may be used for important financial calculations.

---

# 24. Inventory Testing Strategy

## 24.1 Stock Movement Tests

Test:

* Goods receipt increases stock.
* Delivery decreases stock.
* Customer return increases eligible stock.
* Supplier return decreases stock.
* Transfer preserves total company stock.
* Adjustment changes stock with reason.
* Reversal restores original impact.

## 24.2 Reservation Tests

Test:

* Reservation reduces available stock.
* Reservation does not reduce on-hand stock.
* Release restores available stock.
* Concurrent reservation cannot oversell.
* Expired reservation is released.
* Partial reservation follows policy.

## 24.3 Tracking Tests

Test:

* Lot required when configured.
* Expiry date validation.
* Serial uniqueness.
* Delivered serial cannot be reused.
* Quarantine stock is not available.
* Damaged stock is not available.

## 24.4 Valuation Tests

Test:

* FIFO
* Weighted average
* Standard cost
* Cost of goods sold
* Inventory return cost
* Adjustment valuation
* Valuation reversal

---

# 25. Inventory Reconciliation Tests

Validate:

```text
Stock balance projection
=
Sum of posted stock movements
```

Also validate:

```text
Available
=
On Hand
- Reserved
- Quarantine
- Blocked
```

Allow configuration-specific differences only when explicitly documented.

---

# 26. Workflow Testing

Test:

* Sequential approval
* Parallel approval
* Minimum approval count
* Conditional routing
* Approval limit
* Delegation
* Expiration
* Escalation
* Rejection
* Return for correction
* Workflow versioning
* Cancellation of workflow
* Segregation conflict

---

# 27. State-Machine Testing

For every document type, test:

* Valid transitions
* Invalid transitions
* Terminal-state protection
* Cancellation rules
* Reversal rules
* Reopening rules
* Partial-progress states

Example:

```text
DRAFT → SUBMITTED: allowed
DRAFT → POSTED: rejected
POSTED → DRAFT: rejected
POSTED → REVERSED: allowed through reversal command
```

---

# 28. Frontend Unit Testing

Test:

* Validation schemas
* Permission helpers
* Status mapping
* Number formatting
* Date formatting
* Query-key generation
* Calculation previews
* Error normalization

---

# 29. Frontend Component Testing

Test:

* Form fields
* Table filtering
* Pagination
* Confirmation dialogs
* Approval controls
* Sensitive-field masking
* Loading states
* Error states
* Empty states
* Accessibility labels
* Keyboard interaction

---

# 30. Frontend Integration Testing

Test:

* Form submission to mocked API
* Server validation displayed on fields
* Permission-aware buttons
* Tenant switching clears cache
* Query invalidation after mutations
* Token refresh behaviour
* Session expiration
* File upload flow
* Background job progress

Recommended tools:

```text
Vitest
React Testing Library
Mock Service Worker
```

---

# 31. End-to-End Testing

Use Playwright or equivalent.

Critical end-to-end scenarios:

## Lead-to-Cash

```text
Create customer
→ Create product
→ Create sales order
→ Approve
→ Reserve stock
→ Deliver
→ Post invoice
→ Receive payment
→ Verify journal
```

## Procure-to-Pay

```text
Create supplier
→ Create purchase request
→ Approve
→ Create purchase order
→ Receive goods
→ Post supplier invoice
→ Pay supplier
→ Verify journal
```

## Period Closing

```text
Review period
→ Close period
→ Attempt new posting
→ Verify rejection
→ Reopen with authorized role
```

---

# 32. Import Testing

Test:

* Valid file
* Invalid file type
* Missing columns
* Invalid rows
* Duplicate records
* Cross-tenant references
* Partial completion
* Large file
* Cancelled import
* Retry
* Result report

---

# 33. Export Testing

Test:

* Permission required
* Tenant filtering
* Company filtering
* Field masking
* Large export uses background job
* File expires
* Sensitive export is audited
* Unauthorized column is excluded

---

# 34. File Security Testing

Test:

* Invalid MIME type
* Fake extension
* Oversized file
* Malware-positive file
* Cross-tenant file access
* Expired signed URL
* Unauthorized record attachment
* Unsafe filename
* File checksum mismatch

---

# 35. Integration Adapter Testing

Each provider adapter should have contract fixtures.

Test:

* Valid provider response
* Invalid signature
* Timeout
* Duplicate callback
* Provider error
* Unsupported currency
* Reversal
* Malformed payload
* Rate limit
* Sandbox and production configuration separation

External network calls should normally be mocked in automated CI tests.

---

# 36. Security Testing

Security tests should include:

* Authentication bypass
* Authorization bypass
* SQL injection
* Cross-site scripting
* Cross-site request forgery where relevant
* Mass assignment
* Broken object-level authorization
* Token theft scenarios
* Refresh-token reuse
* File upload abuse
* Webhook forgery
* Rate-limit enforcement
* Sensitive log exposure
* Secret scanning

---

# 37. Static and Dependency Security Testing

CI should run:

* Type checking
* Linting
* Static security analysis
* Dependency vulnerability scanning
* Secret scanning
* Container scanning
* License review where required

High-severity findings should block release unless formally accepted.

---

# 38. Performance Testing

Test representative workloads.

## API Targets

* Common reads under expected response targets
* Typical commands under expected response targets
* No unacceptable performance degradation under concurrent use

## Scenarios

* Customer search
* Product search
* Sales order list
* Invoice posting
* Stock reservation
* Dashboard loading
* Large report
* Large import
* Bulk approval

---

# 39. Load Testing

Test increasing load for:

* Concurrent users
* API requests per second
* WebSocket connections
* Queue jobs
* Report requests
* Stock reservations
* Payment callbacks

Tools may include:

```text
k6
Artillery
JMeter
```

---

# 40. Concurrency Testing

Critical concurrency scenarios:

* Final stock unit reserved by two orders
* Same invoice posted twice
* Same payment callback processed twice
* Same document sequence requested simultaneously
* Two users update same draft
* Period closed while posting occurs
* Same approval task acted on twice

---

# 41. Reliability and Failure Testing

Test controlled failures:

* Redis unavailable
* Worker unavailable
* Email provider timeout
* Object storage unavailable
* Database connection interruption
* Event consumer failure
* Application restart during job
* Scheduler restart
* Partial external integration response

The system must fail safely.

---

# 42. Recovery Testing

Test:

* Database restore
* Point-in-time recovery
* File recovery
* Queue recovery
* Application restart
* Reprocessing pending outbox events
* Integrity verification scripts

---

# 43. Test Data Strategy

Use:

* Factories
* Builders
* Seed helpers
* Fixed currencies
* Fixed fiscal periods
* Fixed clocks
* Predictable users and roles

Test data must cover:

* Multiple tenants
* Multiple companies
* Multiple branches
* Different permissions
* Multiple currencies
* Open and closed periods
* Active and inactive products
* Credit-blocked customers
* Approved and suspended suppliers

---

# 44. Test Data Privacy

Do not use real production personal data in development tests.

Use:

* Synthetic names
* Synthetic contact data
* Synthetic bank references
* Masked production-derived datasets only when formally approved

---

# 45. Test Database Strategy

Recommended options:

* Temporary PostgreSQL database per test suite
* Database container per integration pipeline
* Transaction rollback between tests
* Schema reset between test groups

Tests should not depend on a shared developer database.

---

# 46. Test Environments

## Local

Used for fast development testing.

## CI

Used for automated isolated tests.

## Staging

Used for deployment, integration and UAT.

## Performance

Optional dedicated environment for load tests.

Production should not be used as a routine testing environment.

---

# 47. Mocking Strategy

Mock:

* Email providers
* SMS providers
* Payment providers
* Cloud storage
* External tax providers
* External exchange-rate providers

Do not mock the primary PostgreSQL repository in all integration tests.

---

# 48. Coverage Expectations

Coverage percentage alone does not prove quality.

Recommended goals:

* Critical domain rules: near-complete behavioural coverage
* Finance posting paths: complete scenario coverage
* Tenant isolation: every tenant-owned module
* Authentication and permissions: all critical paths
* Ordinary utilities: practical coverage

Coverage reports should identify untested high-risk code.

---

# 49. Defect Severity

## Critical

* Cross-tenant data leak
* Financial imbalance
* Duplicate payment
* Lost inventory transaction
* Authentication bypass
* Production data corruption

## High

* Incorrect approval
* Incorrect invoice total
* Incorrect stock reservation
* Major workflow unavailable

## Medium

* Non-critical feature failure
* Incorrect report filter
* Recoverable integration problem

## Low

* Minor UI issue
* Text inconsistency
* Cosmetic alignment problem

---

# 50. Defect Workflow

```text
NEW
→ TRIAGED
→ ASSIGNED
→ IN_PROGRESS
→ READY_FOR_TEST
→ VERIFIED
→ CLOSED
```

Alternative:

```text
REOPENED
DEFERRED
DUPLICATE
REJECTED
```

Every defect should include:

* Expected behaviour
* Actual behaviour
* Reproduction steps
* Environment
* Severity
* Evidence
* Correlation ID where available

---

# 51. Continuous Integration Quality Gates

Every pull request should pass:

1. Formatting
2. Linting
3. Type checking
4. Unit tests
5. Domain tests
6. Relevant integration tests
7. API contract validation
8. Security scans
9. Build
10. Migration validation

---

# 52. Pull Request Testing Requirements

A pull request must include:

* New tests for new behaviour
* Updated tests for changed behaviour
* Regression test for defects
* No disabled tests without explanation
* No unexplained snapshot changes
* Updated documentation for contract changes

---

# 53. Release Gates

A release candidate must pass:

* Full automated test suite
* Critical end-to-end flows
* Migration test
* Security scans
* Staging deployment
* Smoke tests
* Backup readiness
* Performance check for major changes
* UAT approval where required
* Known-defect review

---

# 54. Smoke Tests

After deployment, verify:

* Application loads
* Login works
* Tenant context loads
* Database is reachable
* Redis is reachable
* Core navigation loads
* Customer search works
* Product search works
* One safe read-only finance query works
* Health checks pass

State-changing production smoke tests should use controlled test tenants or non-destructive operations.

---

# 55. User Acceptance Testing

UAT should be based on business workflows.

Participants may include:

* Sales user
* Procurement user
* Warehouse user
* Accountant
* Finance manager
* Tenant administrator
* Auditor

UAT should validate:

* Usability
* Correct business flow
* Report usefulness
* Approval process
* Error clarity
* Role access

---

# 56. UAT Acceptance Record

Record:

* Scenario
* Tester
* Date
* Result
* Notes
* Defects
* Approval status

UAT does not replace automated testing.

---

# 57. Module Definition of Done

A module story is complete when:

* Requirements are implemented.
* Architecture rules are followed.
* Authorization is implemented.
* Tenant isolation is enforced.
* Validation is implemented.
* Audit requirements are implemented.
* Unit tests pass.
* Integration tests pass.
* API tests pass.
* Frontend tests pass where relevant.
* Documentation is updated.
* Lint and type checking pass.
* No critical placeholders remain.
* Acceptance criteria pass.

---

# 58. System Release Definition of Done

A release is complete when:

* All release stories meet Definition of Done.
* Critical workflows pass end-to-end.
* No unresolved critical defects exist.
* High defects are reviewed.
* Security gates pass.
* Database migration is validated.
* Backup and rollback readiness exist.
* Staging is approved.
* Release notes exist.
* Production health is verified.

---

# 59. Codex Testing Instructions

Codex tasks should include explicit testing expectations.

Example:

```text
Implement sales-order confirmation.

Required tests:

- Unit test for invalid state
- Unit test for credit-blocked customer
- Integration test for transaction rollback
- API authorization test
- Tenant-isolation test
- Outbox-event test
```

Codex should not mark a task complete before running:

```text
pnpm lint
pnpm typecheck
pnpm test
```

and relevant module integration or end-to-end tests.

---

# 60. Testing Decision Summary

```text
Primary Strategy:
Business-behaviour and risk-based testing

Critical Areas:
Tenant isolation, finance, inventory, authentication and authorization

Database:
Real PostgreSQL integration tests

Frontend:
Vitest, React Testing Library and Playwright

API:
Contract, authorization and business-rule tests

Events:
Outbox reliability, idempotency and ordering tests

Release:
Automated quality gates, staging and UAT

Defects:
Regression test required

Completion:
No feature is complete without relevant tests
```

---

# 61. Next Document

Part 11 defines the implementation sequence, milestones, epics, stories and Codex execution model.
