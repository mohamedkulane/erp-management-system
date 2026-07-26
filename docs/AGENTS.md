# ERP Platform Agent Instructions

## Project Overview

This repository contains a multi-tenant enterprise ERP SaaS platform.

The first target industries are:

- Wholesale
- Distribution
- Multi-branch retail
- Small and mid-sized organizations

The platform uses a domain-oriented modular monolith.

## Required Architecture

- Backend: Node.js, TypeScript and NestJS
- Frontend: React, TypeScript and Vite
- Database: PostgreSQL
- ORM: Prisma
- Cache and jobs: Redis and BullMQ
- File storage: S3-compatible object storage
- Styling: Tailwind CSS and shadcn/ui
- Forms: React Hook Form and Zod
- Server state: TanStack Query
- Client state: Zustand
- Tables: TanStack Table
- Testing: Vitest or Jest, React Testing Library and Playwright

## Critical Business Rules

- Never bypass tenant isolation.
- Every tenant-owned query must include trusted tenant context.
- Never trust tenant IDs supplied by clients without authorization.
- Never directly edit posted financial transactions.
- Financial corrections must use reversal or correcting entries.
- Every posted journal must have equal debit and credit totals.
- Never directly edit inventory quantities.
- Every stock change must create a stock movement.
- Posted inventory movements must be immutable.
- Never place important business logic inside controllers.
- Controllers must delegate to application services or command handlers.
- One module must not write directly to another module's private tables.
- Use explicit business command endpoints for approve, confirm, post,
  cancel, close and reverse operations.
- Every sensitive state-changing operation requires authorization.
- Every important business action requires audit logging.
- Cross-module asynchronous events must use the transactional outbox.
- Event consumers must be idempotent.
- Do not implement microservices.
- Do not introduce Kafka or Kubernetes unless a future ADR approves them.
- Do not create placeholder financial or inventory logic.

## Documentation

Always begin with:

- docs/index.md
- docs/roadmap/current-phase.md

Read only the additional documentation relevant to the active story.

Before changing a module, read its documentation under:

- docs/modules/

For platform-wide rules, read:

- docs/architecture/system-architecture.md
- docs/security/security-design.md
- docs/api/api-event-design.md
- docs/testing/testing-strategy.md

## Coding Standards

- Use strict TypeScript.
- Avoid `any`.
- Use descriptive names.
- Keep controllers thin.
- Keep domain logic independent from HTTP and ORM concerns.
- Validate request DTOs.
- Use stable error codes.
- Use UUIDs for internal IDs.
- Use decimal-safe types for money.
- Store timestamps in UTC.
- Use database transactions for atomic business operations.
- Add database constraints for critical integrity rules.
- Do not expose stack traces or internal errors through APIs.
- Do not commit secrets or real credentials.

## Backend Module Structure

Each backend module should normally contain:

- api/
- application/
- domain/
- infrastructure/
- tests/

## Frontend Module Structure

Each frontend module should normally contain:

- api/
- components/
- forms/
- hooks/
- pages/
- schemas/
- tables/
- types/

## Required Validation Before Completion

Before declaring a task complete:

1. Run formatting.
2. Run linting.
3. Run TypeScript type checking.
4. Run relevant unit tests.
5. Run relevant integration tests.
6. Run end-to-end tests when the story changes a critical workflow.
7. Verify tenant isolation.
8. Verify authorization.
9. Update documentation if an API, event, schema or business rule changes.
10. Remove dead code and unfinished placeholders.

## Standard Commands

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration`
- `pnpm test:e2e`
- `pnpm db:migrate`
- `pnpm db:seed`

If one of these commands does not yet exist, create it only when it belongs
to the active foundation story.

## Scope Control

Implement only the current story.

Do not implement future modules merely because related documentation exists.

When requirements conflict:

1. Stop implementation.
2. Identify the conflicting documents.
3. Explain the conflict.
4. Recommend a resolution.
5. Do not silently choose a new architecture.

## Completion Report

At the end of every task, report:

- What was implemented
- Files changed
- Database migrations
- Tests added
- Commands executed
- Test results
- Remaining limitations
- Documentation updated