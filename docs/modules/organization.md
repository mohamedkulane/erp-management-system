# Organization Module

**Status:** Ready for implementation planning  
**Module Code:** `organization`

## 1. Purpose

The Organization module defines the internal structure of each tenant.

## 2. Responsibilities

- Companies
- Branches
- Departments
- Cost centers
- Fiscal years
- Fiscal periods
- Organization hierarchy
- Operational context
- Company and branch access scopes

## 3. Core Entities

### Company

- `id`
- `tenant_id`
- `code`
- `name`
- `legal_name`
- `registration_number`
- `tax_number`
- `base_currency`
- `timezone`
- `status`

### Branch

- `id`
- `tenant_id`
- `company_id`
- `code`
- `name`
- `address_id`
- `status`

### Department

- `id`
- `tenant_id`
- `company_id`
- `parent_department_id`
- `code`
- `name`
- `manager_user_id`

### CostCenter

- `id`
- `tenant_id`
- `company_id`
- `code`
- `name`
- `status`

### FiscalYear

- `id`
- `company_id`
- `name`
- `start_date`
- `end_date`
- `status`

### FiscalPeriod

- `id`
- `fiscal_year_id`
- `period_number`
- `start_date`
- `end_date`
- `status`

Statuses:

- `OPEN`
- `SOFT_CLOSED`
- `CLOSED`
- `LOCKED`

## 4. Business Rules

- Company code is unique within tenant.
- Branch code is unique within company.
- Department hierarchy cannot contain cycles.
- Fiscal periods cannot overlap within a fiscal year.
- Posting requires an open fiscal period.
- Closed fiscal periods require authorized reopening.
- Company and branch context must be validated server-side.
- Deactivated organization records remain available for historical records.

## 5. Main Use Cases

- Create company
- Create branch
- Create department
- Create cost center
- Create fiscal year
- Generate fiscal periods
- Open or close period
- Reopen period
- Switch company
- Switch branch

## 6. API Endpoints

```text
POST   /api/v1/organization/companies
GET    /api/v1/organization/companies
PATCH  /api/v1/organization/companies/{id}

POST   /api/v1/organization/branches
GET    /api/v1/organization/branches

POST   /api/v1/organization/departments
GET    /api/v1/organization/departments

POST   /api/v1/organization/cost-centers
GET    /api/v1/organization/cost-centers

POST   /api/v1/organization/fiscal-years
POST   /api/v1/organization/fiscal-periods/{id}/close
POST   /api/v1/organization/fiscal-periods/{id}/reopen
```

## 7. Permissions

- `company.view`
- `company.create`
- `company.update`
- `branch.manage`
- `department.manage`
- `cost_center.manage`
- `fiscal_period.close`
- `fiscal_period.reopen`

## 8. Domain Events

- `CompanyCreated`
- `BranchCreated`
- `DepartmentCreated`
- `CostCenterCreated`
- `FiscalPeriodClosed`
- `FiscalPeriodReopened`

## 9. Testing Requirements

- Tenant isolation
- Company and branch uniqueness
- Department cycle prevention
- Fiscal-period overlap prevention
- Closed-period posting rejection
- Reopening authorization
- Organization-scope authorization
