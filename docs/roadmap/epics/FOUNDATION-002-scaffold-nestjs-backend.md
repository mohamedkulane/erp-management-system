# FOUNDATION-002 — Scaffold NestJS Backend

## Goal

Create the technical backend foundation for the ERP platform using
NestJS and strict TypeScript.

## Dependencies

- FOUNDATION-001 completed
- Root pnpm workspace operational
- `server` workspace recognized

## In Scope

- NestJS application scaffolding
- Strict TypeScript
- API prefix `/api/v1`
- Configuration module
- Environment validation
- Global validation pipe
- Global exception filter
- Correlation ID middleware
- Structured logger foundation
- Health module
- Liveness endpoint
- Readiness endpoint
- Unit-test configuration
- Integration-test configuration
- Real backend scripts in `server/package.json`

## Out of Scope

- Authentication
- Authorization
- Tenant database models
- Prisma schema
- PostgreSQL connection
- Redis
- BullMQ
- Object storage
- Business modules
- Frontend changes

## Required Endpoints

```text
GET /api/v1/health/live
GET /api/v1/health/ready