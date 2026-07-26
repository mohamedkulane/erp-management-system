# Customers Module

**Status:** Ready for implementation planning  
**Module Code:** `customers`

## 1. Purpose

The Customers module manages customer master data, credit profiles, addresses and commercial status.

## 2. Responsibilities

- Customer creation
- Customer approval
- Customer numbering
- Customer groups
- Contacts and addresses
- Payment terms
- Credit limits
- Credit blocks
- Customer status
- Customer 360 view

## 3. Core Entities

### Customer

- `id`
- `tenant_id`
- `party_id`
- `customer_number`
- `customer_group_id`
- `status`
- `salesperson_id`
- `payment_term_id`
- `price_list_id`
- `currency_code`

Statuses:

- `PROSPECT`
- `PENDING_APPROVAL`
- `ACTIVE`
- `ON_HOLD`
- `CREDIT_BLOCKED`
- `INACTIVE`
- `BLACKLISTED`
- `REJECTED`

### CustomerCreditProfile

- `customer_id`
- `credit_limit`
- `credit_days`
- `risk_rating`
- `temporary_limit`
- `temporary_limit_expiry`
- `blocked_reason`

### CustomerAddress

- Billing
- Shipping
- Registered
- Other

## 4. Business Rules

- Customer number is unique within tenant.
- Customer must be active before normal sales.
- Credit sales require an approved credit profile.
- Credit-blocked customers cannot confirm new credit orders without override.
- Credit-limit changes require permission and audit.
- Duplicate customers should be detected using name, phone, email, tax number and registration number.
- Historical customers must not be hard-deleted.

## 5. Main Use Cases

- Create customer
- Submit for approval
- Approve or reject customer
- Update contact information
- Configure payment terms
- Configure credit profile
- Apply credit block
- Remove credit block
- View customer 360
- View credit exposure
- Deactivate customer

## 6. API Endpoints

```text
POST   /api/v1/customers
GET    /api/v1/customers
GET    /api/v1/customers/{id}
PATCH  /api/v1/customers/{id}
POST   /api/v1/customers/{id}/submit
POST   /api/v1/customers/{id}/approve
POST   /api/v1/customers/{id}/reject
POST   /api/v1/customers/{id}/credit-block
POST   /api/v1/customers/{id}/remove-credit-block
GET    /api/v1/customers/{id}/360-view
GET    /api/v1/customers/{id}/credit-exposure
```

## 7. Permissions

- `customer.view`
- `customer.create`
- `customer.update`
- `customer.approve`
- `customer.credit_manage`
- `customer.export`

## 8. Domain Events

- `CustomerCreated`
- `CustomerSubmittedForApproval`
- `CustomerApproved`
- `CustomerRejected`
- `CustomerCreditUpdated`
- `CustomerCreditBlocked`
- `CustomerCreditBlockRemoved`
- `CustomerDeactivated`

## 9. Testing Requirements

- Number uniqueness
- Duplicate detection
- Approval workflow
- Credit-limit permissions
- Credit-block enforcement
- Field-level security
- Customer 360 authorization
- Tenant isolation
