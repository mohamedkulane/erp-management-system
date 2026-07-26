# Architecture Decision Records

## ADR-001 — Use a Modular Monolith

**Status:** Accepted

The ERP platform will use a domain-oriented modular monolith.

### Decision

- One deployable backend application
- Strong internal module boundaries
- In-process application contracts
- Domain events and transactional outbox
- No microservices in the initial architecture

### Reason

This approach provides enterprise structure without unnecessary distributed-system complexity.

---

## ADR-002 — Use PostgreSQL as the Primary Database

**Status:** Accepted

PostgreSQL is the source of truth for transactional ERP data.

### Reason

It provides:

- ACID transactions
- Strong constraints
- Relational integrity
- Advanced indexing
- Row-Level Security support
- Reliable financial and inventory storage

---

## ADR-003 — Use Shared-Database Multi-Tenancy

**Status:** Accepted

Tenant-owned tables include `tenant_id`.

### Controls

- Trusted server-side tenant context
- Tenant-scoped repositories
- Tenant-safe unique constraints
- Automated isolation tests
- Optional PostgreSQL Row-Level Security

---

## ADR-004 — Use Double-Entry Accounting

**Status:** Accepted

Every posted financial transaction must create balanced debit and credit journal lines.

Posted financial records are immutable. Corrections use reversal or correcting entries.

---

## ADR-005 — Use Movement-Based Inventory

**Status:** Accepted

Inventory balances are derived from immutable stock movements.

Direct editing of on-hand quantity is prohibited.

---

## ADR-006 — Use a Transactional Outbox

**Status:** Accepted

Business changes and asynchronous event records are stored in the same database transaction.

Consumers must be idempotent.

---

## ADR-007 — Use REST APIs with Explicit Business Commands

**Status:** Accepted

Resource queries use REST endpoints.

Important state transitions use explicit command endpoints such as:

```text
POST /sales/orders/{id}/confirm
POST /finance/journals/{id}/post
POST /warehouse/deliveries/{id}/reverse
```

Direct status manipulation is prohibited.

---

## ADR-008 — Use React for the Frontend

**Status:** Accepted

The ERP frontend uses React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Zustand and React Hook Form.

---

## ADR-009 — Use NestJS for the Backend

**Status:** Accepted

The backend uses NestJS and strict TypeScript with module-oriented layering:

- API
- Application
- Domain
- Infrastructure

---

## ADR-010 — Start with Weighted-Average Inventory Costing

**Status:** Proposed**

The first complete inventory valuation implementation should use weighted-average costing.

FIFO may be added after the base lead-to-cash and procure-to-pay flows are stable.
