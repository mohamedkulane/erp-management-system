# Current Development Phase

## Phase

Phase 0 — Repository and Engineering Foundation

## Active Epic

Epic 0.1 — Monorepo Setup

## Active Story

FOUNDATION-001 — Initialize the ERP monorepo

## Goal

Create the repository structure and workspace configuration required
for the frontend, backend, documentation and infrastructure.

## In Scope

- Root workspace configuration
- client folder
- server folder
- packages folder
- docs folder
- infrastructure folder
- shared root scripts
- TypeScript configuration foundation
- Git ignore file
- environment example
- root README

## Out of Scope

- Authentication
- Database business tables
- Tenant implementation
- Sales
- Inventory
- Finance
- Production deployment

## Completion Conditions

- `pnpm install` succeeds.
- Root workspace recognizes frontend and backend.
- Root commands are documented.
- No business module is implemented.