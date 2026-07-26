# Suppliers Module

**Status:** Ready for implementation planning  
**Module Code:** `suppliers`

## 1. Purpose

The Suppliers module manages supplier master data, approval, payment terms and bank details.

## 2. Responsibilities

- Supplier onboarding
- Supplier approval
- Supplier numbering
- Supplier categories
- Contacts and addresses
- Payment terms
- Bank details
- Supplier suspension
- Risk status
- Supplier performance foundation

## 3. Core Entities

### Supplier

- `id`
- `tenant_id`
- `party_id`
- `supplier_number`
- `supplier_category_id`
- `status`
- `currency_code`
- `payment_term_id`
- `tax_number`

Statuses:

- `DRAFT`
- `PENDING_APPROVAL`
- `APPROVED`
- `ACTIVE`
- `ON_HOLD`
- `SUSPENDED`
- `BLACKLISTED`
- `INACTIVE`
- `REJECTED`

### SupplierBankAccount

- `supplier_id`
- `bank_name`
- `account_name`
- `encrypted_account_number`
- `masked_account_number`
- `currency_code`
- `verification_status`
- `effective_from`
- `effective_to`

## 4. Business Rules

- Supplier number is unique within tenant.
- Purchase orders require an approved and active supplier.
- Bank-account changes require independent verification and approval.
- Supplier bank details are restricted and encrypted.
- Suspended suppliers cannot receive new purchase orders.
- Duplicate supplier invoices require prevention in Finance.
- Historical suppliers must not be hard-deleted.

## 5. Main Use Cases

- Create supplier
- Submit supplier
- Approve supplier
- Reject supplier
- Add bank account
- Request bank-account change
- Verify bank account
- Approve bank-account change
- Suspend supplier
- Reactivate supplier

## 6. API Endpoints

```text
POST   /api/v1/suppliers
GET    /api/v1/suppliers
GET    /api/v1/suppliers/{id}
PATCH  /api/v1/suppliers/{id}
POST   /api/v1/suppliers/{id}/submit
POST   /api/v1/suppliers/{id}/approve
POST   /api/v1/suppliers/{id}/suspend
POST   /api/v1/suppliers/{id}/reactivate
POST   /api/v1/suppliers/{id}/bank-accounts
POST   /api/v1/suppliers/{id}/bank-account-change
```

## 7. Permissions

- `supplier.view`
- `supplier.create`
- `supplier.update`
- `supplier.approve`
- `supplier.suspend`
- `supplier.bank_view`
- `supplier.bank_change`
- `supplier.bank_approve`

## 8. Domain Events

- `SupplierCreated`
- `SupplierSubmittedForApproval`
- `SupplierApproved`
- `SupplierRejected`
- `SupplierSuspended`
- `SupplierReactivated`
- `SupplierBankChangeRequested`
- `SupplierBankDetailsChanged`

## 9. Testing Requirements

- Supplier uniqueness
- Approval workflow
- Suspension enforcement
- Bank-detail masking
- Bank-detail approval segregation
- Tenant isolation
- Unauthorized bank-detail access
