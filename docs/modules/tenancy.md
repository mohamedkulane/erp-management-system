# Tenancy Module

**Status:** Ready for implementation planning  
**Module Code:** `tenancy`

## 1. Purpose

The Tenancy module manages SaaS tenants and provides the root isolation boundary for all ERP business data.

## 2. Responsibilities

- Create and manage tenants
- Maintain tenant status
- Maintain tenant settings
- Enable or disable tenant modules
- Enforce tenant lifecycle rules
- Provide trusted tenant context
- Support tenant suspension and reactivation
- Support future subscription and usage controls

## 3. Core Entities

### Tenant

Key fields:

- `id`
- `code`
- `name`
- `legal_name`
- `status`
- `default_locale`
- `default_timezone`
- `default_currency`
- `created_at`
- `updated_at`

Suggested statuses:

- `TRIAL`
- `ACTIVE`
- `SUSPENDED`
- `TERMINATED`

### TenantSetting

Stores configurable tenant-wide settings.

Examples:

- Default language
- Time zone
- Date format
- Number format
- Default currency
- Password policy
- Session policy
- Document retention policy

### TenantModule

Tracks enabled ERP modules.

Examples:

- CRM
- Sales
- Procurement
- Inventory
- Finance
- HR
- Payroll

## 4. Core Business Rules

- Tenant code must be unique.
- Suspended tenants cannot perform business transactions.
- Terminated tenants cannot authenticate.
- A tenant cannot access another tenant’s data.
- Tenant context must come from authenticated server-side context.
- Tenant IDs supplied by clients are never trusted without membership validation.
- Tenant deletion must follow retention and archival rules.
- Module enablement must not bypass dependencies.

## 5. Main Use Cases

- Create tenant
- View tenant
- Update tenant settings
- Suspend tenant
- Reactivate tenant
- Enable tenant module
- Disable tenant module
- Switch active tenant
- View tenant usage summary

## 6. API Endpoints

```text
POST   /api/v1/platform/tenants
GET    /api/v1/platform/tenants
GET    /api/v1/platform/tenants/{id}
PATCH  /api/v1/platform/tenants/{id}
POST   /api/v1/platform/tenants/{id}/suspend
POST   /api/v1/platform/tenants/{id}/reactivate
GET    /api/v1/platform/tenants/{id}/modules
PUT    /api/v1/platform/tenants/{id}/modules
```

## 7. Permissions

- `tenant.view`
- `tenant.create`
- `tenant.update`
- `tenant.suspend`
- `tenant.reactivate`
- `tenant.configure_modules`

## 8. Domain Events

- `TenantCreated`
- `TenantUpdated`
- `TenantSuspended`
- `TenantReactivated`
- `TenantModuleEnabled`
- `TenantModuleDisabled`

## 9. Audit Requirements

Audit:

- Tenant creation
- Status changes
- Settings changes
- Module changes
- Tenant switching
- Administrative support access

## 10. Testing Requirements

- Tenant code uniqueness
- Suspended tenant access rejection
- Cross-tenant access rejection
- Module dependency validation
- Tenant switching
- Audit generation
- Authorization enforcement

## 11. Out of Scope for Initial Story

- Subscription billing
- Usage metering
- Custom domains
- Tenant data export
- Tenant deletion automation
