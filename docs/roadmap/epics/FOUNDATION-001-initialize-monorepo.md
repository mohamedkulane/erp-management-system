# FOUNDATION-001 — Initialize ERP Monorepo

## Business Goal

Create a reliable project foundation for the multi-tenant ERP platform.

## Dependencies

None.

## In Scope

- Root pnpm workspace
- client package placeholder
- server package placeholder
- packages directory
- documentation directory
- infrastructure directory
- root scripts
- TypeScript base configuration
- .gitignore
- .env.example
- README

## Out of Scope

- NestJS business modules
- React business pages
- PostgreSQL schema
- Authentication
- Multi-tenancy implementation
- Docker services
- CI/CD

## Required Files

- package.json
- pnpm-workspace.yaml
- tsconfig.base.json
- .gitignore
- .env.example
- README.md
- client/package.json
- server/package.json

## Acceptance Criteria

1. `pnpm install` succeeds.
2. `pnpm --recursive list` identifies client and server workspaces.
3. Root scripts exist for development, build, lint, type checking and tests.
4. Project structure matches the documentation.
5. No unrelated business features are created.
6. Repository documentation explains how to start development.

## Tests and Validation

- Validate package manifests.
- Run workspace installation.
- Run available lint and type-check commands.