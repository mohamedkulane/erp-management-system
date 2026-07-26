# Finance Module

**Status:** Ready for implementation planning  
**Module Code:** `finance`

## 1. Purpose

The Finance module provides double-entry accounting, receivables, payables, payments, fiscal controls, bank reconciliation and financial reporting.

## 2. Core Design Rules

- Every posted financial transaction creates balanced journal lines.
- Posted transactions are immutable.
- Corrections use reversal, credit note, debit note or correcting entry.
- Operational modules do not directly update the general ledger.
- Fiscal-period status controls posting.
- Control accounts are updated through approved subledger transactions.

## 3. Responsibilities

- Chart of accounts
- Journals
- Journal posting
- Journal reversal
- Customer invoices
- Supplier invoices
- Customer payments
- Supplier payments
- Payment allocations
- Credit notes
- Debit notes
- Accounts receivable
- Accounts payable
- Bank and cash accounts
- Bank reconciliation
- Fiscal periods
- Financial reports
- Multi-currency foundation

## 4. Core Entities

### Account

- `id`
- `tenant_id`
- `company_id`
- `code`
- `name`
- `account_type`
- `parent_account_id`
- `is_posting_account`
- `is_control_account`
- `status`

### JournalEntry

States:

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `APPROVED`
- `POSTED`
- `REVERSED`
- `REJECTED`
- `CANCELLED`

### JournalLine

- Account
- Debit
- Credit
- Currency
- Base amount
- Department
- Cost center
- Branch
- Source reference

### CustomerInvoice

States:

- `DRAFT`
- `PENDING_APPROVAL`
- `APPROVED`
- `POSTED`
- `PARTIALLY_PAID`
- `PAID`
- `OVERDUE`
- `CREDITED`
- `REVERSED`

### SupplierInvoice

States:

- `DRAFT`
- `MATCHING`
- `MATCHED`
- `EXCEPTION`
- `PENDING_APPROVAL`
- `APPROVED`
- `POSTED`
- `PARTIALLY_PAID`
- `PAID`
- `REVERSED`

### Payment

Supports:

- Customer receipt
- Supplier payment
- Customer advance
- Supplier advance
- Refund
- Transfer

## 5. Accounting Posting Examples

Customer invoice:

```text
Debit  Accounts Receivable
Credit Sales Revenue
Credit Tax Payable
```

Customer payment:

```text
Debit  Bank or Cash
Credit Accounts Receivable
```

Goods receipt:

```text
Debit  Inventory
Credit Goods Received Not Invoiced
```

Supplier invoice:

```text
Debit  GRNI / Expense / Asset / Tax
Credit Accounts Payable
```

Supplier payment:

```text
Debit  Accounts Payable
Credit Bank or Cash
```

Delivery:

```text
Debit  Cost of Goods Sold
Credit Inventory
```

## 6. Business Rules

- Total debit must equal total credit.
- Base-currency debit must equal base-currency credit.
- Posting account must be active.
- Posting period must be open.
- Posted records cannot be edited.
- Reversal must reference original posting.
- Payment allocation cannot exceed invoice balance.
- Duplicate supplier invoice must be prevented.
- Supplier bank changes require independent approval.
- Manual journals may require preparer and poster separation.
- Control accounts cannot be posted manually unless explicitly allowed.

## 7. Main Use Cases

- Create account
- Create journal
- Submit journal
- Approve journal
- Post journal
- Reverse journal
- Create customer invoice
- Post customer invoice
- Receive customer payment
- Allocate customer payment
- Create supplier invoice
- Match supplier invoice
- Post supplier invoice
- Pay supplier
- Reconcile bank statement
- Close fiscal period
- Reopen fiscal period
- Run trial balance
- Run income statement
- Run balance sheet

## 8. API Endpoints

```text
POST   /api/v1/finance/accounts
GET    /api/v1/finance/accounts

POST   /api/v1/finance/journals
GET    /api/v1/finance/journals/{id}
POST   /api/v1/finance/journals/{id}/submit
POST   /api/v1/finance/journals/{id}/approve
POST   /api/v1/finance/journals/{id}/post
POST   /api/v1/finance/journals/{id}/reverse

POST   /api/v1/finance/customer-invoices
POST   /api/v1/finance/customer-invoices/{id}/post
POST   /api/v1/finance/customer-invoices/{id}/reverse

POST   /api/v1/finance/supplier-invoices
POST   /api/v1/finance/supplier-invoices/{id}/match
POST   /api/v1/finance/supplier-invoices/{id}/post

POST   /api/v1/finance/payments
POST   /api/v1/finance/payments/{id}/approve
POST   /api/v1/finance/payments/{id}/post
POST   /api/v1/finance/payments/{id}/allocate
POST   /api/v1/finance/payments/{id}/reverse

GET    /api/v1/reporting/reports/trial-balance
GET    /api/v1/reporting/reports/income-statement
GET    /api/v1/reporting/reports/balance-sheet
GET    /api/v1/reporting/reports/receivables-aging
GET    /api/v1/reporting/reports/payables-aging
```

## 9. Permissions

- `account.view`
- `account.manage`
- `journal.view`
- `journal.create`
- `journal.approve`
- `journal.post`
- `journal.reverse`
- `customer_invoice.view`
- `customer_invoice.post`
- `supplier_invoice.view`
- `supplier_invoice.match`
- `supplier_invoice.post`
- `payment.create`
- `payment.approve`
- `payment.post`
- `payment.reverse`
- `financial_report.view`
- `fiscal_period.close`
- `fiscal_period.reopen`

## 10. Domain Events

- `JournalPosted`
- `JournalReversed`
- `CustomerInvoicePosted`
- `CustomerInvoiceReversed`
- `SupplierInvoiceMatched`
- `SupplierInvoicePosted`
- `CustomerPaymentPosted`
- `SupplierPaymentPosted`
- `PaymentAllocated`
- `PaymentReversed`
- `FiscalPeriodClosed`
- `FiscalPeriodReopened`

## 11. Testing Requirements

- Balanced journals
- Base-currency balancing
- Closed-period rejection
- Control-account protection
- Posting immutability
- Reversal correctness
- Customer invoice posting
- Supplier invoice matching
- Duplicate invoice detection
- Payment idempotency
- Allocation limits
- Segregation of duties
- Financial reconciliation
- Tenant isolation
