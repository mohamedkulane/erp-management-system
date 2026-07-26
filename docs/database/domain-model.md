# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 4: Database Domain Model and Entity Relationship Design

**Document Status:** Initial Database Design Draft
**Depends On:**

* Part 1 — Product Vision and Business Scope
* Part 2 — Detailed Business Requirements
* Part 3 — System Architecture and Domain Design

**Database Engine:** PostgreSQL
**Architecture:** Multi-Tenant Modular Monolith
**Data Model:** Relational, Ledger-Based and Audit-Oriented
**Initial Scope:** ERP Platform Core, CRM, Sales, Procurement, Inventory, Warehouse and Finance

---

# 1. Purpose of This Document

This document defines the initial relational database model for the ERP platform.

It identifies:

* Database naming conventions
* Primary keys
* Tenant ownership
* Organization relationships
* Core master-data tables
* Transaction tables
* Ledger tables
* Foreign keys
* Unique constraints
* Indexing requirements
* Data integrity rules
* Multi-company and multi-branch support
* Audit and workflow structures
* MVP database scope

The database must protect important business rules even when application validation fails.

The database is not merely a storage location. It is an important integrity layer for:

* Financial consistency
* Inventory consistency
* Tenant isolation
* Referential integrity
* Uniqueness
* Historical traceability
* Concurrency control

---

# 2. Database Design Principles

## Principle 1: Every Tenant Record Has Trusted Ownership

Every tenant-owned record must include:

```text
tenant_id
```

Most business transactions must also include:

```text
company_id
```

Where relevant, they may also include:

```text
branch_id
department_id
cost_center_id
profit_center_id
project_id
```

---

## Principle 2: Master Data Is Deactivated, Not Deleted

Records such as customers, suppliers, products, employees and accounts should normally use status or active flags.

They should not be physically deleted after transactions reference them.

---

## Principle 3: Posted Transactions Are Immutable

Posted financial and inventory records must not be directly edited.

Corrections must use:

* Reversal
* Adjustment
* Return
* Credit note
* Debit note
* Correcting entry

---

## Principle 4: Balances Are Derived from Ledgers

The following values should be derived from transaction ledgers:

* General ledger balances
* Customer balances
* Supplier balances
* Inventory quantities
* Inventory valuation
* Payment allocations
* Asset depreciation

Cached or summarized balances may exist for performance, but ledgers remain the source of truth.

---

## Principle 5: Use Database Constraints

The database should enforce:

* Primary keys
* Foreign keys
* Uniqueness
* Required fields
* Positive quantities
* Valid monetary values
* Valid date ranges
* Balanced-status prerequisites where possible
* Tenant ownership

---

## Principle 6: Avoid Polymorphic Foreign Keys for Core Finance

A generic structure such as:

```text
reference_type
reference_id
```

may be useful for attachments or audit metadata.

However, critical financial relationships should use explicit fields and controlled source references where possible.

---

## Principle 7: Store Historical Transaction Values

Transactions must store the values used when the transaction occurred.

Examples:

* Product description
* Unit price
* Tax rate
* Exchange rate
* Customer address
* Supplier address
* Payment terms

Future changes to master data must not silently change historical transactions.

---

# 3. PostgreSQL Schema Organization

Recommended schemas:

```text
platform
identity
organization
workflow
audit
documents
notifications
crm
sales
procurement
inventory
warehouse
finance
reporting
integration
```

Example table names:

```text
platform.tenants
identity.users
organization.companies
crm.leads
sales.sales_orders
procurement.purchase_orders
inventory.stock_movements
finance.journal_entries
```

Where the ORM does not support PostgreSQL schemas reliably, equivalent table prefixes may be used.

Example:

```text
platform_tenants
identity_users
sales_orders
finance_journal_entries
```

---

# 4. Naming Conventions

## 4.1 Tables

Use plural snake_case names.

```text
customers
sales_orders
journal_entries
stock_movements
```

## 4.2 Columns

Use snake_case.

```text
created_at
customer_id
posting_date
exchange_rate
```

## 4.3 Primary Keys

Use:

```text
id
```

Recommended type:

```text
UUID
```

UUIDs are preferred because they:

* Avoid exposing sequential business volume
* Support distributed ID generation
* Reduce collision risk across future services
* Simplify data migration between environments

Business document numbers remain separate fields.

---

## 4.4 Foreign Keys

Use:

```text
customer_id
sales_order_id
company_id
tenant_id
```

## 4.5 Boolean Fields

Use clear names:

```text
is_active
is_default
requires_approval
allows_negative_stock
```

## 4.6 Timestamp Fields

Use:

```text
created_at
updated_at
submitted_at
approved_at
posted_at
cancelled_at
deleted_at
```

---

# 5. Common Base Fields

Most master-data tables should contain:

```text
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
code VARCHAR
name VARCHAR
status VARCHAR
is_active BOOLEAN
created_by UUID
updated_by UUID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
version INTEGER
```

Most transaction-header tables should contain:

```text
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
company_id UUID NOT NULL
branch_id UUID NULL
document_number VARCHAR NOT NULL
document_date DATE NOT NULL
posting_date DATE NULL
status VARCHAR NOT NULL
workflow_status VARCHAR NULL
currency_id UUID NOT NULL
exchange_rate NUMERIC(19,8)
created_by UUID NOT NULL
updated_by UUID NULL
submitted_by UUID NULL
approved_by UUID NULL
posted_by UUID NULL
cancelled_by UUID NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
submitted_at TIMESTAMPTZ NULL
approved_at TIMESTAMPTZ NULL
posted_at TIMESTAMPTZ NULL
cancelled_at TIMESTAMPTZ NULL
cancellation_reason TEXT NULL
version INTEGER NOT NULL
```

---

# 6. Shared Data Types

## Monetary Amounts

Recommended:

```text
NUMERIC(19,4)
```

Examples:

```text
unit_price
line_total
tax_amount
debit_amount
credit_amount
```

## Exchange Rates

Recommended:

```text
NUMERIC(19,8)
```

## Quantities

Recommended:

```text
NUMERIC(19,6)
```

## Percentages

Recommended:

```text
NUMERIC(9,6)
```

Example:

```text
15.000000
```

## Dates

Use:

```text
DATE
```

for business dates.

Use:

```text
TIMESTAMPTZ
```

for technical timestamps.

---

# 7. Platform and Tenant Tables

## 7.1 platform.tenants

Purpose:

Stores SaaS customer accounts.

Fields:

```text
id
tenant_code
name
legal_name
status
subscription_plan_id
default_language
default_timezone
default_country_code
primary_contact_name
primary_contact_email
primary_contact_phone
trial_ends_at
subscription_starts_at
subscription_ends_at
storage_quota_bytes
created_at
updated_at
```

Constraints:

```text
UNIQUE (tenant_code)
```

Statuses:

```text
TRIAL
ACTIVE
SUSPENDED
EXPIRED
TERMINATED
```

---

## 7.2 platform.subscription_plans

Fields:

```text
id
code
name
description
billing_cycle
base_price
currency_code
maximum_users
maximum_companies
maximum_branches
maximum_storage_bytes
is_active
created_at
updated_at
```

---

## 7.3 platform.tenant_modules

Purpose:

Stores enabled modules for a tenant.

Fields:

```text
id
tenant_id
module_code
is_enabled
enabled_at
disabled_at
configuration_json
```

Constraint:

```text
UNIQUE (tenant_id, module_code)
```

---

## 7.4 platform.tenant_settings

Fields:

```text
id
tenant_id
setting_key
setting_value_json
is_sensitive
updated_by
updated_at
```

Constraint:

```text
UNIQUE (tenant_id, setting_key)
```

Sensitive values should be encrypted outside normal plaintext storage.

---

## 7.5 platform.feature_flags

Fields:

```text
id
code
name
description
default_enabled
created_at
updated_at
```

---

## 7.6 platform.tenant_feature_flags

Fields:

```text
id
tenant_id
feature_flag_id
is_enabled
configuration_json
```

Constraint:

```text
UNIQUE (tenant_id, feature_flag_id)
```

---

# 8. Identity and Authentication Tables

## 8.1 identity.users

Fields:

```text
id
tenant_id
employee_id
username
email
phone
display_name
password_hash
status
email_verified_at
phone_verified_at
last_login_at
password_changed_at
must_change_password
mfa_required
created_at
updated_at
```

Constraints:

```text
UNIQUE (tenant_id, username)
UNIQUE (tenant_id, email)
```

A platform administrator may exist outside ordinary tenant membership. This should be handled through a controlled platform identity model rather than a fake tenant.

---

## 8.2 identity.user_sessions

Fields:

```text
id
user_id
tenant_id
refresh_token_hash
device_name
device_type
ip_address
user_agent
created_at
last_activity_at
expires_at
revoked_at
revocation_reason
```

Indexes:

```text
(user_id, revoked_at)
(tenant_id, expires_at)
```

---

## 8.3 identity.login_attempts

Fields:

```text
id
tenant_id
user_id
identifier
ip_address
user_agent
was_successful
failure_reason
attempted_at
```

---

## 8.4 identity.mfa_methods

Fields:

```text
id
user_id
method_type
secret_encrypted
phone
email
is_primary
is_verified
created_at
disabled_at
```

Method types:

```text
TOTP
EMAIL_OTP
SMS_OTP
RECOVERY_CODE
```

---

## 8.5 identity.password_history

Fields:

```text
id
user_id
password_hash
created_at
```

Used to prevent recent password reuse.

---

## 8.6 identity.service_accounts

Purpose:

Used by integrations.

Fields:

```text
id
tenant_id
name
client_id
client_secret_hash
status
expires_at
last_used_at
created_at
updated_at
```

---

# 9. Authorization Tables

## 9.1 identity.roles

Fields:

```text
id
tenant_id
code
name
description
role_type
is_system_role
is_active
created_at
updated_at
```

Constraint:

```text
UNIQUE (tenant_id, code)
```

---

## 9.2 identity.permissions

Fields:

```text
id
code
module_code
resource
action
description
```

Examples:

```text
sales_order.view
sales_order.create
sales_order.confirm
purchase_order.approve
journal_entry.post
customer.export
```

Constraint:

```text
UNIQUE (code)
```

---

## 9.3 identity.role_permissions

Fields:

```text
id
role_id
permission_id
scope_type
conditions_json
```

Constraint:

```text
UNIQUE (role_id, permission_id, scope_type)
```

Scope types:

```text
OWN
TEAM
DEPARTMENT
BRANCH
COMPANY
TENANT
CUSTOM
```

---

## 9.4 identity.user_roles

Fields:

```text
id
tenant_id
user_id
role_id
company_id
branch_id
department_id
effective_from
effective_until
assigned_by
assigned_at
```

---

## 9.5 identity.user_data_scopes

Fields:

```text
id
tenant_id
user_id
scope_type
company_id
branch_id
department_id
cost_center_id
resource_type
can_view
can_create
can_edit
can_approve
```

---

## 9.6 identity.delegations

Fields:

```text
id
tenant_id
delegator_user_id
delegate_user_id
delegation_type
effective_from
effective_until
reason
status
approved_by
created_at
```

---

## 9.7 identity.segregation_rules

Fields:

```text
id
tenant_id
rule_code
name
description
conflicting_permission_a
conflicting_permission_b
severity
is_blocking
is_active
```

---

# 10. Organization Tables

## 10.1 organization.companies

Represents legal entities.

Fields:

```text
id
tenant_id
parent_company_id
company_code
legal_name
trading_name
registration_number
tax_number
country_code
base_currency_id
fiscal_calendar_id
default_language
default_timezone
status
created_at
updated_at
```

Constraints:

```text
UNIQUE (tenant_id, company_code)
UNIQUE (tenant_id, registration_number)
```

---

## 10.2 organization.branches

Fields:

```text
id
tenant_id
company_id
branch_code
name
address_id
manager_employee_id
default_warehouse_id
default_cash_account_id
status
created_at
updated_at
```

Constraint:

```text
UNIQUE (tenant_id, company_id, branch_code)
```

---

## 10.3 organization.departments

Fields:

```text
id
tenant_id
company_id
branch_id
parent_department_id
department_code
name
manager_employee_id
status
created_at
updated_at
```

---

## 10.4 organization.business_units

Fields:

```text
id
tenant_id
company_id
parent_business_unit_id
code
name
description
status
```

---

## 10.5 organization.cost_centers

Fields:

```text
id
tenant_id
company_id
parent_cost_center_id
code
name
manager_employee_id
status
```

Constraint:

```text
UNIQUE (tenant_id, company_id, code)
```

---

## 10.6 organization.profit_centers

Fields:

```text
id
tenant_id
company_id
parent_profit_center_id
code
name
manager_employee_id
status
```

---

## 10.7 organization.addresses

A reusable address structure.

Fields:

```text
id
tenant_id
address_type
country_code
region
city
district
street
building
postal_code
latitude
longitude
is_primary
created_at
updated_at
```

Addresses may be linked through explicit relationship tables.

---

## 10.8 organization.fiscal_calendars

Fields:

```text
id
tenant_id
code
name
start_month
period_type
is_active
```

---

## 10.9 organization.fiscal_years

Fields:

```text
id
tenant_id
company_id
fiscal_calendar_id
name
start_date
end_date
status
closed_at
closed_by
```

Statuses:

```text
PLANNED
OPEN
CLOSING
CLOSED
```

---

## 10.10 organization.fiscal_periods

Fields:

```text
id
tenant_id
company_id
fiscal_year_id
period_number
name
start_date
end_date
status
locked_modules_json
closed_at
closed_by
```

Statuses:

```text
FUTURE
OPEN
SOFT_CLOSED
CLOSED
LOCKED
```

Constraint:

```text
UNIQUE (tenant_id, company_id, fiscal_year_id, period_number)
```

---

# 11. Currency and Exchange Rate Tables

## 11.1 organization.currencies

Fields:

```text
id
code
name
symbol
decimal_places
is_active
```

Constraint:

```text
UNIQUE (code)
```

---

## 11.2 organization.exchange_rates

Fields:

```text
id
tenant_id
company_id
source_currency_id
target_currency_id
rate
rate_date
rate_type
source
created_at
```

Constraint:

```text
UNIQUE (
  tenant_id,
  company_id,
  source_currency_id,
  target_currency_id,
  rate_date,
  rate_type
)
```

---

# 12. Shared Party Model

Customers and suppliers can be based on a common party structure.

## 12.1 organization.parties

Fields:

```text
id
tenant_id
party_type
legal_name
trading_name
registration_number
tax_number
primary_email
primary_phone
website
status
created_at
updated_at
```

Party types:

```text
ORGANIZATION
INDIVIDUAL
GOVERNMENT
NONPROFIT
```

---

## 12.2 organization.party_addresses

Fields:

```text
id
tenant_id
party_id
address_id
address_role
is_primary
```

Address roles:

```text
BILLING
SHIPPING
OFFICE
WAREHOUSE
OTHER
```

---

## 12.3 organization.party_contacts

Fields:

```text
id
tenant_id
party_id
first_name
last_name
job_title
department
email
phone
whatsapp_number
is_primary
status
created_at
updated_at
```

---

# 13. Customer Tables

## 13.1 sales.customers

Fields:

```text
id
tenant_id
party_id
customer_number
customer_group_id
customer_type
default_currency_id
default_price_list_id
payment_term_id
credit_limit
credit_status
salesperson_id
territory_id
status
approved_at
approved_by
created_at
updated_at
```

Constraints:

```text
UNIQUE (tenant_id, customer_number)
UNIQUE (tenant_id, party_id)
```

Credit statuses:

```text
NORMAL
ON_HOLD
CREDIT_BLOCKED
BLACKLISTED
```

---

## 13.2 sales.customer_groups

Fields:

```text
id
tenant_id
parent_group_id
code
name
default_price_list_id
default_payment_term_id
is_active
```

---

## 13.3 sales.customer_credit_profiles

Fields:

```text
id
tenant_id
company_id
customer_id
credit_limit
credit_days
risk_rating
temporary_limit
temporary_limit_expires_at
last_review_date
next_review_date
status
```

Constraint:

```text
UNIQUE (tenant_id, company_id, customer_id)
```

---

## 13.4 sales.customer_status_history

Fields:

```text
id
tenant_id
customer_id
previous_status
new_status
reason
changed_by
changed_at
```

---

# 14. Supplier Tables

## 14.1 procurement.suppliers

Fields:

```text
id
tenant_id
party_id
supplier_number
supplier_category_id
default_currency_id
payment_term_id
supplier_rating
approval_status
status
approved_by
approved_at
created_at
updated_at
```

Constraints:

```text
UNIQUE (tenant_id, supplier_number)
UNIQUE (tenant_id, party_id)
```

---

## 14.2 procurement.supplier_categories

Fields:

```text
id
tenant_id
parent_category_id
code
name
description
is_active
```

---

## 14.3 procurement.supplier_bank_accounts

Fields:

```text
id
tenant_id
supplier_id
bank_name
account_name
account_number_encrypted
iban_encrypted
swift_code
currency_id
is_primary
status
verified_by
verified_at
created_at
updated_at
```

Sensitive fields must be encrypted and masked.

---

## 14.4 procurement.supplier_evaluations

Fields:

```text
id
tenant_id
company_id
supplier_id
evaluation_period_start
evaluation_period_end
quality_score
delivery_score
price_score
service_score
invoice_accuracy_score
overall_score
reviewed_by
reviewed_at
```

---

# 15. Product Master Tables

## 15.1 inventory.products

Fields:

```text
id
tenant_id
product_code
sku
name
short_description
long_description
product_type
category_id
brand_id
base_uom_id
purchase_uom_id
sales_uom_id
tax_category_id
inventory_policy
costing_method
tracking_method
allows_negative_stock
shelf_life_days
status
created_at
updated_at
```

Constraints:

```text
UNIQUE (tenant_id, product_code)
UNIQUE (tenant_id, sku)
```

Product types:

```text
STOCK_ITEM
NON_STOCK_ITEM
SERVICE
ASSET
EXPENSE_ITEM
MANUFACTURED_ITEM
BUNDLE
DIGITAL_ITEM
```

Tracking methods:

```text
NONE
LOT
SERIAL
LOT_AND_EXPIRY
```

Costing methods:

```text
FIFO
WEIGHTED_AVERAGE
STANDARD_COST
SPECIFIC_IDENTIFICATION
```

---

## 15.2 inventory.product_categories

Fields:

```text
id
tenant_id
parent_category_id
code
name
inventory_account_id
cost_of_goods_sold_account_id
sales_account_id
purchase_account_id
is_active
```

---

## 15.3 inventory.brands

Fields:

```text
id
tenant_id
code
name
description
is_active
```

---

## 15.4 inventory.units_of_measure

Fields:

```text
id
tenant_id
code
name
uom_type
decimal_places
is_active
```

Constraint:

```text
UNIQUE (tenant_id, code)
```

---

## 15.5 inventory.uom_conversions

Fields:

```text
id
tenant_id
product_id
from_uom_id
to_uom_id
conversion_factor
is_bidirectional
```

Constraint:

```text
UNIQUE (tenant_id, product_id, from_uom_id, to_uom_id)
```

---

## 15.6 inventory.product_barcodes

Fields:

```text
id
tenant_id
product_id
barcode
uom_id
pack_quantity
is_primary
```

Constraint:

```text
UNIQUE (tenant_id, barcode)
```

---

## 15.7 inventory.product_attributes

Fields:

```text
id
tenant_id
code
name
data_type
is_variant_attribute
is_active
```

---

## 15.8 inventory.product_attribute_values

Fields:

```text
id
tenant_id
attribute_id
value_code
value_name
display_order
```

---

## 15.9 inventory.product_variants

Fields:

```text
id
tenant_id
parent_product_id
variant_product_id
attribute_signature
```

Constraint:

```text
UNIQUE (tenant_id, parent_product_id, attribute_signature)
```

---

# 16. Pricing Tables

## 16.1 sales.price_lists

Fields:

```text
id
tenant_id
company_id
code
name
currency_id
price_list_type
effective_from
effective_until
status
```

Types:

```text
SALES
PURCHASE
CONTRACT
PROMOTIONAL
```

---

## 16.2 sales.price_list_items

Fields:

```text
id
tenant_id
price_list_id
product_id
uom_id
minimum_quantity
unit_price
effective_from
effective_until
```

Indexes:

```text
(price_list_id, product_id, effective_from)
```

---

## 16.3 sales.discount_rules

Fields:

```text
id
tenant_id
company_id
code
name
rule_type
customer_id
customer_group_id
product_id
product_category_id
minimum_quantity
discount_percent
discount_amount
effective_from
effective_until
priority
requires_approval
status
```

---

## 16.4 sales.payment_terms

Fields:

```text
id
tenant_id
code
name
description
is_active
```

---

## 16.5 sales.payment_term_lines

Fields:

```text
id
tenant_id
payment_term_id
sequence_number
due_type
days_after
percentage
fixed_amount
```

The sum of percentages must equal 100% where percentage-based schedules are used.

---

# 17. CRM Tables

## 17.1 crm.leads

Fields:

```text
id
tenant_id
company_id
lead_number
party_name
contact_name
email
phone
company_name
lead_source_id
industry_id
territory_id
assigned_user_id
estimated_value
currency_id
priority
status
qualification_score
created_at
updated_at
converted_at
```

Constraint:

```text
UNIQUE (tenant_id, lead_number)
```

---

## 17.2 crm.lead_sources

Fields:

```text
id
tenant_id
code
name
is_active
```

---

## 17.3 crm.opportunities

Fields:

```text
id
tenant_id
company_id
opportunity_number
lead_id
customer_id
name
description
sales_stage_id
estimated_value
currency_id
probability
expected_close_date
assigned_user_id
status
lost_reason_id
won_at
lost_at
created_at
updated_at
```

---

## 17.4 crm.sales_stages

Fields:

```text
id
tenant_id
code
name
sequence_number
default_probability
is_won_stage
is_lost_stage
is_active
```

---

## 17.5 crm.activities

Fields:

```text
id
tenant_id
company_id
activity_type
subject
description
lead_id
opportunity_id
customer_id
assigned_user_id
due_at
completed_at
status
created_by
created_at
```

Activity types:

```text
CALL
MEETING
EMAIL
TASK
FOLLOW_UP
NOTE
```

---

## 17.6 crm.lost_reasons

Fields:

```text
id
tenant_id
code
name
description
is_active
```

---

# 18. Sales Document Tables

## 18.1 sales.quotations

Fields:

```text
id
tenant_id
company_id
branch_id
quotation_number
customer_id
opportunity_id
quotation_date
expiry_date
currency_id
exchange_rate
price_list_id
payment_term_id
salesperson_id
subtotal
discount_total
tax_total
charge_total
grand_total
base_grand_total
status
workflow_status
version_number
created_by
submitted_by
approved_by
accepted_at
converted_sales_order_id
created_at
updated_at
```

Constraint:

```text
UNIQUE (tenant_id, company_id, quotation_number)
```

---

## 18.2 sales.quotation_lines

Fields:

```text
id
tenant_id
quotation_id
line_number
product_id
product_code_snapshot
description_snapshot
uom_id
quantity
unit_price
discount_percent
discount_amount
taxable_amount
tax_amount
line_total
warehouse_id
requested_delivery_date
```

Constraint:

```text
UNIQUE (quotation_id, line_number)
```

---

## 18.3 sales.quotation_taxes

Fields:

```text
id
tenant_id
quotation_id
quotation_line_id
tax_code_id
tax_rate
taxable_amount
tax_amount
sequence_number
```

---

## 18.4 sales.quotation_versions

Fields:

```text
id
tenant_id
quotation_id
version_number
snapshot_json
revision_reason
created_by
created_at
```

---

## 18.5 sales.sales_orders

Fields:

```text
id
tenant_id
company_id
branch_id
sales_order_number
customer_id
quotation_id
order_date
requested_delivery_date
currency_id
exchange_rate
price_list_id
payment_term_id
salesperson_id
warehouse_id
subtotal
discount_total
tax_total
charge_total
grand_total
base_grand_total
reserved_amount
delivered_amount
invoiced_amount
status
workflow_status
credit_check_status
stock_check_status
created_by
submitted_by
approved_by
confirmed_by
confirmed_at
cancelled_at
created_at
updated_at
version
```

Constraint:

```text
UNIQUE (tenant_id, company_id, sales_order_number)
```

---

## 18.6 sales.sales_order_lines

Fields:

```text
id
tenant_id
sales_order_id
line_number
product_id
description_snapshot
uom_id
ordered_quantity
reserved_quantity
delivered_quantity
invoiced_quantity
returned_quantity
unit_price
discount_percent
discount_amount
taxable_amount
tax_amount
line_total
warehouse_id
requested_delivery_date
status
```

Checks:

```text
ordered_quantity > 0
reserved_quantity >= 0
delivered_quantity >= 0
invoiced_quantity >= 0
```

---

## 18.7 sales.sales_order_taxes

Fields:

```text
id
tenant_id
sales_order_id
sales_order_line_id
tax_code_id
tax_rate
taxable_amount
tax_amount
```

---

## 18.8 sales.sales_order_status_history

Fields:

```text
id
tenant_id
sales_order_id
previous_status
new_status
reason
changed_by
changed_at
```

---

## 18.9 sales.sales_returns

Fields:

```text
id
tenant_id
company_id
branch_id
return_number
customer_id
sales_order_id
delivery_id
customer_invoice_id
return_date
warehouse_id
return_reason
resolution_type
status
created_by
approved_by
posted_by
created_at
updated_at
```

Resolution types:

```text
REFUND
CREDIT_NOTE
REPLACEMENT
REPAIR
REJECTION
```

---

## 18.10 sales.sales_return_lines

Fields:

```text
id
tenant_id
sales_return_id
product_id
uom_id
quantity
condition_code
lot_id
serial_number_id
unit_value
reason
```

---

# 19. Procurement Document Tables

## 19.1 procurement.purchase_requests

Fields:

```text
id
tenant_id
company_id
branch_id
department_id
cost_center_id
purchase_request_number
request_date
required_date
requester_id
business_justification
estimated_total
currency_id
budget_check_status
status
workflow_status
created_at
updated_at
```

---

## 19.2 procurement.purchase_request_lines

Fields:

```text
id
tenant_id
purchase_request_id
line_number
product_id
description
uom_id
requested_quantity
approved_quantity
ordered_quantity
estimated_unit_cost
preferred_supplier_id
warehouse_id
required_date
project_id
```

---

## 19.3 procurement.requests_for_quotation

Fields:

```text
id
tenant_id
company_id
rfq_number
purchase_request_id
issue_date
response_deadline
currency_id
status
created_by
created_at
updated_at
```

---

## 19.4 procurement.rfq_suppliers

Fields:

```text
id
tenant_id
rfq_id
supplier_id
invitation_status
sent_at
responded_at
```

Constraint:

```text
UNIQUE (rfq_id, supplier_id)
```

---

## 19.5 procurement.supplier_quotations

Fields:

```text
id
tenant_id
company_id
supplier_quotation_number
rfq_id
supplier_id
supplier_reference
quotation_date
valid_until
currency_id
exchange_rate
payment_term_id
delivery_days
subtotal
tax_total
charge_total
grand_total
status
created_at
updated_at
```

---

## 19.6 procurement.supplier_quotation_lines

Fields:

```text
id
tenant_id
supplier_quotation_id
rfq_line_id
product_id
uom_id
quantity
unit_price
discount_amount
tax_amount
line_total
delivery_date
warranty_terms
```

---

## 19.7 procurement.purchase_orders

Fields:

```text
id
tenant_id
company_id
branch_id
purchase_order_number
supplier_id
purchase_request_id
supplier_quotation_id
order_date
expected_delivery_date
currency_id
exchange_rate
payment_term_id
warehouse_id
subtotal
discount_total
tax_total
charge_total
grand_total
base_grand_total
received_amount
invoiced_amount
status
workflow_status
created_by
submitted_by
approved_by
sent_at
created_at
updated_at
version
```

---

## 19.8 procurement.purchase_order_lines

Fields:

```text
id
tenant_id
purchase_order_id
line_number
product_id
description_snapshot
uom_id
ordered_quantity
received_quantity
invoiced_quantity
returned_quantity
unit_price
discount_amount
taxable_amount
tax_amount
line_total
warehouse_id
expected_delivery_date
status
```

---

## 19.9 procurement.purchase_order_versions

Fields:

```text
id
tenant_id
purchase_order_id
version_number
snapshot_json
change_reason
created_by
created_at
```

---

## 19.10 procurement.purchase_returns

Fields:

```text
id
tenant_id
company_id
purchase_return_number
supplier_id
purchase_order_id
goods_receipt_id
supplier_invoice_id
return_date
warehouse_id
reason
status
created_by
approved_by
posted_by
created_at
updated_at
```

---

# 20. Warehouse Structure Tables

## 20.1 warehouse.warehouses

Fields:

```text
id
tenant_id
company_id
branch_id
warehouse_code
name
warehouse_type
address_id
allows_negative_stock
is_transit_warehouse
status
created_at
updated_at
```

Constraint:

```text
UNIQUE (tenant_id, company_id, warehouse_code)
```

---

## 20.2 warehouse.zones

Fields:

```text
id
tenant_id
warehouse_id
zone_code
name
zone_type
temperature_min
temperature_max
status
```

---

## 20.3 warehouse.locations

Represents aisles, racks or bins.

Fields:

```text
id
tenant_id
warehouse_id
parent_location_id
location_code
name
location_type
barcode
capacity
is_pickable
is_receivable
is_quarantine
is_active
```

Constraint:

```text
UNIQUE (tenant_id, warehouse_id, location_code)
```

---

## 20.4 warehouse.goods_receipts

Fields:

```text
id
tenant_id
company_id
branch_id
goods_receipt_number
receipt_type
purchase_order_id
transfer_order_id
customer_return_id
supplier_id
warehouse_id
receipt_date
posting_date
status
inspection_status
created_by
received_by
approved_by
posted_by
created_at
updated_at
```

---

## 20.5 warehouse.goods_receipt_lines

Fields:

```text
id
tenant_id
goods_receipt_id
purchase_order_line_id
product_id
uom_id
received_quantity
accepted_quantity
rejected_quantity
warehouse_location_id
lot_id
expiry_date
unit_cost
status
```

---

## 20.6 warehouse.delivery_notes

Fields:

```text
id
tenant_id
company_id
branch_id
delivery_number
sales_order_id
customer_id
warehouse_id
delivery_date
posting_date
shipping_address_snapshot
carrier_id
driver_name
vehicle_reference
tracking_number
status
created_by
picked_by
packed_by
posted_by
created_at
updated_at
```

---

## 20.7 warehouse.delivery_note_lines

Fields:

```text
id
tenant_id
delivery_note_id
sales_order_line_id
product_id
uom_id
delivered_quantity
warehouse_location_id
lot_id
serial_number_id
unit_cost
```

---

## 20.8 warehouse.warehouse_tasks

Fields:

```text
id
tenant_id
warehouse_id
task_type
source_document_type
source_document_id
assigned_user_id
priority
status
started_at
completed_at
created_at
```

Task types:

```text
RECEIVE
PUT_AWAY
PICK
PACK
SHIP
COUNT
TRANSFER
INSPECT
```

---

## 20.9 warehouse.packages

Fields:

```text
id
tenant_id
delivery_note_id
package_number
weight
length
width
height
tracking_number
packed_by
packed_at
```

---

## 20.10 warehouse.package_lines

Fields:

```text
id
tenant_id
package_id
delivery_note_line_id
product_id
quantity
```

---

# 21. Inventory Ledger Tables

## 21.1 inventory.stock_movements

Represents a posted inventory transaction.

Fields:

```text
id
tenant_id
company_id
branch_id
movement_number
movement_type
source_document_type
source_document_id
movement_date
posting_date
status
created_by
posted_by
reversed_movement_id
created_at
posted_at
```

Movement types:

```text
PURCHASE_RECEIPT
SALES_DELIVERY
CUSTOMER_RETURN
SUPPLIER_RETURN
TRANSFER
ADJUSTMENT_IN
ADJUSTMENT_OUT
PRODUCTION_ISSUE
PRODUCTION_RECEIPT
OPENING_BALANCE
DAMAGE_WRITE_OFF
```

Constraint:

```text
UNIQUE (tenant_id, company_id, movement_number)
```

---

## 21.2 inventory.stock_movement_lines

Fields:

```text
id
tenant_id
stock_movement_id
line_number
product_id
uom_id
quantity
base_quantity
source_warehouse_id
source_location_id
destination_warehouse_id
destination_location_id
lot_id
serial_number_id
unit_cost
total_cost
currency_id
valuation_layer_id
```

Checks:

```text
quantity > 0
base_quantity > 0
```

---

## 21.3 inventory.stock_balances

A performance projection, not the original source of truth.

Fields:

```text
id
tenant_id
company_id
product_id
warehouse_id
location_id
lot_id
quantity_on_hand
quantity_reserved
quantity_available
quantity_incoming
quantity_outgoing
quantity_quarantine
inventory_value
average_unit_cost
updated_at
version
```

Constraint:

```text
UNIQUE (
  tenant_id,
  company_id,
  product_id,
  warehouse_id,
  location_id,
  lot_id
)
```

---

## 21.4 inventory.stock_reservations

Fields:

```text
id
tenant_id
company_id
product_id
warehouse_id
location_id
lot_id
source_document_type
source_document_id
source_line_id
reserved_quantity
fulfilled_quantity
released_quantity
status
reserved_at
expires_at
created_by
```

Statuses:

```text
ACTIVE
PARTIALLY_FULFILLED
FULFILLED
RELEASED
EXPIRED
CANCELLED
```

---

## 21.5 inventory.inventory_lots

Fields:

```text
id
tenant_id
product_id
lot_number
manufacturing_date
expiry_date
supplier_id
status
created_at
```

Constraint:

```text
UNIQUE (tenant_id, product_id, lot_number)
```

---

## 21.6 inventory.serial_numbers

Fields:

```text
id
tenant_id
product_id
serial_number
lot_id
current_warehouse_id
current_location_id
status
received_at
delivered_at
created_at
updated_at
```

Constraint:

```text
UNIQUE (tenant_id, serial_number)
```

Statuses:

```text
AVAILABLE
RESERVED
DELIVERED
RETURNED
DAMAGED
QUARANTINED
SCRAPPED
```

---

## 21.7 inventory.inventory_valuation_layers

Fields:

```text
id
tenant_id
company_id
product_id
warehouse_id
stock_movement_line_id
valuation_method
quantity
remaining_quantity
unit_cost
total_value
remaining_value
currency_id
posting_date
created_at
```

This table is particularly important for FIFO and specific-cost tracking.

---

## 21.8 inventory.inventory_adjustments

Fields:

```text
id
tenant_id
company_id
branch_id
adjustment_number
warehouse_id
adjustment_date
reason_code_id
status
workflow_status
created_by
approved_by
posted_by
created_at
updated_at
```

---

## 21.9 inventory.inventory_adjustment_lines

Fields:

```text
id
tenant_id
inventory_adjustment_id
product_id
location_id
lot_id
system_quantity
counted_quantity
variance_quantity
unit_cost
variance_value
reason
```

---

## 21.10 inventory.stock_counts

Fields:

```text
id
tenant_id
company_id
warehouse_id
count_number
count_type
scheduled_date
started_at
completed_at
status
created_by
approved_by
```

Count types:

```text
FULL
CYCLE
SPOT
ABC
```

---

# 22. Finance Master Tables

## 22.1 finance.account_types

Fields:

```text
id
code
name
normal_balance
financial_statement_group
```

Examples:

```text
ASSET
LIABILITY
EQUITY
REVENUE
COST_OF_SALES
EXPENSE
OTHER_INCOME
OTHER_EXPENSE
```

---

## 22.2 finance.accounts

Fields:

```text
id
tenant_id
company_id
parent_account_id
account_code
name
account_type_id
normal_balance
is_posting_account
allows_manual_posting
currency_id
reconciliation_required
status
created_at
updated_at
```

Constraint:

```text
UNIQUE (tenant_id, company_id, account_code)
```

---

## 22.3 finance.journals

Fields:

```text
id
tenant_id
company_id
journal_code
name
journal_type
default_debit_account_id
default_credit_account_id
requires_approval
status
```

Journal types:

```text
GENERAL
SALES
PURCHASE
CASH
BANK
PAYROLL
INVENTORY
ASSET
ADJUSTMENT
```

---

## 22.4 finance.accounting_dimensions

Fields:

```text
id
tenant_id
company_id
dimension_code
name
source_type
is_required
is_active
```

Possible dimensions:

* Branch
* Department
* Cost center
* Profit center
* Project
* Product category
* Sales channel

---

# 23. General Ledger Tables

## 23.1 finance.journal_entries

Fields:

```text
id
tenant_id
company_id
branch_id
journal_entry_number
journal_id
source_module
source_document_type
source_document_id
document_date
posting_date
currency_id
exchange_rate
description
total_debit
total_credit
base_total_debit
base_total_credit
status
workflow_status
reversal_of_entry_id
reversed_by_entry_id
created_by
approved_by
posted_by
created_at
approved_at
posted_at
```

Constraints:

```text
UNIQUE (tenant_id, company_id, journal_entry_number)
CHECK (total_debit = total_credit)
CHECK (base_total_debit = base_total_credit)
```

---

## 23.2 finance.journal_lines

Fields:

```text
id
tenant_id
journal_entry_id
line_number
account_id
party_type
customer_id
supplier_id
employee_id
description
debit_amount
credit_amount
base_debit_amount
base_credit_amount
currency_id
exchange_rate
branch_id
department_id
cost_center_id
profit_center_id
project_id
reconciliation_reference
```

Checks:

```text
debit_amount >= 0
credit_amount >= 0
NOT (debit_amount > 0 AND credit_amount > 0)
```

Constraint:

```text
UNIQUE (journal_entry_id, line_number)
```

---

## 23.3 finance.ledger_balances

Optional summarized projection.

Fields:

```text
id
tenant_id
company_id
account_id
fiscal_period_id
branch_id
cost_center_id
opening_debit
opening_credit
period_debit
period_credit
closing_debit
closing_credit
updated_at
```

The journal lines remain the source of truth.

---

# 24. Accounts Receivable Tables

## 24.1 finance.customer_invoices

Fields:

```text
id
tenant_id
company_id
branch_id
invoice_number
customer_id
sales_order_id
delivery_note_id
invoice_date
posting_date
due_date
currency_id
exchange_rate
payment_term_id
billing_address_snapshot
shipping_address_snapshot
subtotal
discount_total
tax_total
charge_total
grand_total
base_grand_total
paid_amount
outstanding_amount
status
workflow_status
journal_entry_id
created_by
approved_by
posted_by
created_at
updated_at
```

Statuses:

```text
DRAFT
PENDING_APPROVAL
APPROVED
POSTED
PARTIALLY_PAID
PAID
OVERDUE
CREDITED
CANCELLED
REVERSED
```

---

## 24.2 finance.customer_invoice_lines

Fields:

```text
id
tenant_id
customer_invoice_id
line_number
sales_order_line_id
delivery_note_line_id
product_id
description_snapshot
uom_id
quantity
unit_price
discount_amount
taxable_amount
tax_amount
line_total
revenue_account_id
cost_center_id
```

---

## 24.3 finance.customer_credit_notes

Fields:

```text
id
tenant_id
company_id
credit_note_number
customer_id
original_invoice_id
credit_note_date
posting_date
reason
currency_id
exchange_rate
grand_total
status
journal_entry_id
created_at
posted_at
```

---

## 24.4 finance.customer_credit_note_lines

Fields:

```text
id
tenant_id
customer_credit_note_id
original_invoice_line_id
product_id
quantity
unit_price
tax_amount
line_total
reason
```

---

## 24.5 finance.receivable_ledger

Optional explicit subledger projection.

Fields:

```text
id
tenant_id
company_id
customer_id
transaction_type
source_document_id
posting_date
due_date
debit_amount
credit_amount
base_debit_amount
base_credit_amount
remaining_amount
status
journal_line_id
```

---

# 25. Accounts Payable Tables

## 25.1 finance.supplier_invoices

Fields:

```text
id
tenant_id
company_id
branch_id
supplier_invoice_number
internal_invoice_number
supplier_id
purchase_order_id
goods_receipt_id
invoice_date
posting_date
due_date
currency_id
exchange_rate
payment_term_id
subtotal
discount_total
tax_total
charge_total
grand_total
base_grand_total
paid_amount
outstanding_amount
matching_status
status
workflow_status
journal_entry_id
created_by
approved_by
posted_by
created_at
updated_at
```

Matching statuses:

```text
NOT_REQUIRED
PENDING
MATCHED
WITHIN_TOLERANCE
EXCEPTION
BLOCKED
```

---

## 25.2 finance.supplier_invoice_lines

Fields:

```text
id
tenant_id
supplier_invoice_id
purchase_order_line_id
goods_receipt_line_id
product_id
description_snapshot
uom_id
quantity
unit_price
discount_amount
taxable_amount
tax_amount
line_total
expense_account_id
inventory_account_id
cost_center_id
```

---

## 25.3 finance.payable_ledger

Fields:

```text
id
tenant_id
company_id
supplier_id
transaction_type
source_document_id
posting_date
due_date
debit_amount
credit_amount
base_debit_amount
base_credit_amount
remaining_amount
status
journal_line_id
```

---

# 26. Payment and Banking Tables

## 26.1 finance.payment_methods

Fields:

```text
id
tenant_id
code
name
method_type
requires_reference
requires_bank_account
is_active
```

Types:

```text
CASH
BANK_TRANSFER
CHEQUE
CARD
MOBILE_MONEY
INTERNAL_CLEARING
```

---

## 26.2 finance.bank_accounts

Fields:

```text
id
tenant_id
company_id
bank_name
account_name
account_number_encrypted
iban_encrypted
swift_code
currency_id
general_ledger_account_id
branch_id
is_primary
status
created_at
updated_at
```

---

## 26.3 finance.cash_accounts

Fields:

```text
id
tenant_id
company_id
branch_id
code
name
general_ledger_account_id
currency_id
custodian_user_id
status
```

---

## 26.4 finance.payments

Fields:

```text
id
tenant_id
company_id
branch_id
payment_number
payment_direction
party_type
customer_id
supplier_id
employee_id
payment_method_id
bank_account_id
cash_account_id
payment_date
posting_date
currency_id
exchange_rate
amount
base_amount
reference_number
external_transaction_id
status
workflow_status
journal_entry_id
created_by
approved_by
posted_by
created_at
updated_at
```

Payment directions:

```text
RECEIPT
PAYMENT
TRANSFER
REFUND
```

Constraint:

```text
UNIQUE (tenant_id, company_id, payment_number)
```

---

## 26.5 finance.payment_allocations

Fields:

```text
id
tenant_id
payment_id
allocation_type
customer_invoice_id
supplier_invoice_id
credit_note_id
advance_reference_id
allocated_amount
base_allocated_amount
created_at
```

---

## 26.6 finance.bank_statements

Fields:

```text
id
tenant_id
company_id
bank_account_id
statement_reference
statement_date
period_start
period_end
opening_balance
closing_balance
currency_id
status
imported_file_id
created_at
```

---

## 26.7 finance.bank_statement_lines

Fields:

```text
id
tenant_id
bank_statement_id
transaction_date
value_date
description
reference
debit_amount
credit_amount
running_balance
matched_payment_id
reconciliation_status
```

---

## 26.8 finance.bank_reconciliations

Fields:

```text
id
tenant_id
company_id
bank_account_id
reconciliation_date
statement_id
book_balance
statement_balance
difference
status
prepared_by
approved_by
created_at
approved_at
```

---

# 27. Tax Tables

## 27.1 finance.tax_codes

Fields:

```text
id
tenant_id
company_id
code
name
tax_type
rate
tax_account_id
recoverable_tax_account_id
effective_from
effective_until
is_inclusive
status
```

---

## 27.2 finance.tax_rules

Fields:

```text
id
tenant_id
company_id
tax_code_id
customer_group_id
supplier_category_id
product_category_id
country_code
transaction_type
priority
effective_from
effective_until
status
```

---

## 27.3 finance.tax_exemptions

Fields:

```text
id
tenant_id
party_id
tax_code_id
certificate_reference
effective_from
effective_until
reason
attachment_id
status
```

---

# 28. Workflow Tables

## 28.1 workflow.workflow_definitions

Fields:

```text
id
tenant_id
company_id
code
name
document_type
description
status
created_at
updated_at
```

---

## 28.2 workflow.workflow_versions

Fields:

```text
id
tenant_id
workflow_definition_id
version_number
effective_from
effective_until
definition_json
status
created_by
created_at
```

Constraint:

```text
UNIQUE (workflow_definition_id, version_number)
```

---

## 28.3 workflow.workflow_steps

Fields:

```text
id
tenant_id
workflow_version_id
step_code
name
sequence_number
approval_type
assignment_type
role_id
user_id
minimum_approvals
timeout_hours
escalation_step_id
conditions_json
```

---

## 28.4 workflow.workflow_instances

Fields:

```text
id
tenant_id
company_id
workflow_definition_id
workflow_version_id
document_type
document_id
current_step_id
status
started_by
started_at
completed_at
```

Constraint:

```text
UNIQUE (tenant_id, document_type, document_id, status)
```

---

## 28.5 workflow.approval_tasks

Fields:

```text
id
tenant_id
workflow_instance_id
workflow_step_id
assigned_user_id
assigned_role_id
status
due_at
acted_by
acted_at
action
comments
delegated_from_user_id
created_at
```

Statuses:

```text
PENDING
APPROVED
REJECTED
RETURNED
DELEGATED
EXPIRED
CANCELLED
```

---

## 28.6 workflow.approval_history

Fields:

```text
id
tenant_id
workflow_instance_id
approval_task_id
action
actor_id
previous_status
new_status
comments
acted_at
```

This table should be append-only.

---

# 29. Audit Tables

## 29.1 audit.audit_events

Fields:

```text
id
tenant_id
company_id
branch_id
event_category
event_type
module
actor_user_id
actor_type
record_type
record_id
action
previous_values_json
new_values_json
reason
ip_address
user_agent
correlation_id
causation_id
occurred_at
```

Indexes:

```text
(tenant_id, occurred_at)
(tenant_id, record_type, record_id)
(tenant_id, actor_user_id, occurred_at)
(correlation_id)
```

---

## 29.2 audit.security_events

Fields:

```text
id
tenant_id
user_id
event_type
severity
ip_address
user_agent
details_json
occurred_at
resolved_at
resolved_by
```

---

## 29.3 audit.data_exports

Fields:

```text
id
tenant_id
user_id
export_type
resource_type
filter_summary_json
row_count
file_id
status
requested_at
completed_at
expires_at
```

---

## 29.4 audit.support_access_sessions

Fields:

```text
id
tenant_id
platform_user_id
approved_by_tenant_user_id
access_level
reason
started_at
expires_at
ended_at
ip_address
status
```

---

# 30. Document Tables

## 30.1 documents.files

Fields:

```text
id
tenant_id
storage_provider
storage_key
original_filename
normalized_filename
mime_type
file_extension
size_bytes
checksum
security_classification
scan_status
uploaded_by
uploaded_at
deleted_at
```

---

## 30.2 documents.file_links

Fields:

```text
id
tenant_id
file_id
record_type
record_id
document_role
created_by
created_at
```

Examples of document roles:

```text
PAYMENT_PROOF
SUPPLIER_QUOTATION
CONTRACT
CUSTOMER_SIGNATURE
EMPLOYEE_DOCUMENT
INVOICE_ATTACHMENT
```

---

## 30.3 documents.file_versions

Fields:

```text
id
tenant_id
logical_document_id
file_id
version_number
change_reason
created_by
created_at
```

---

# 31. Notification Tables

## 31.1 notifications.templates

Fields:

```text
id
tenant_id
code
name
channel
language_code
subject_template
body_template
is_system_template
status
created_at
updated_at
```

---

## 31.2 notifications.notifications

Fields:

```text
id
tenant_id
user_id
notification_type
title
message
record_type
record_id
priority
is_read
read_at
created_at
```

---

## 31.3 notifications.delivery_jobs

Fields:

```text
id
tenant_id
notification_id
channel
recipient
template_id
payload_json
status
attempt_count
next_attempt_at
last_error
provider_message_id
created_at
sent_at
delivered_at
```

---

## 31.4 notifications.user_preferences

Fields:

```text
id
tenant_id
user_id
notification_type
in_app_enabled
email_enabled
sms_enabled
whatsapp_enabled
push_enabled
```

Constraint:

```text
UNIQUE (tenant_id, user_id, notification_type)
```

---

# 32. Integration and Outbox Tables

## 32.1 integration.outbox_events

Fields:

```text
id
tenant_id
company_id
event_type
event_version
aggregate_type
aggregate_id
payload_json
headers_json
correlation_id
causation_id
occurred_at
available_at
processed_at
attempt_count
last_error
status
```

Indexes:

```text
(status, available_at)
(tenant_id, aggregate_type, aggregate_id)
```

---

## 32.2 integration.processed_events

Fields:

```text
id
consumer_name
event_id
processed_at
result_status
error_message
```

Constraint:

```text
UNIQUE (consumer_name, event_id)
```

---

## 32.3 integration.webhook_subscriptions

Fields:

```text
id
tenant_id
name
endpoint_url
secret_encrypted
event_types_json
status
created_at
updated_at
```

---

## 32.4 integration.webhook_deliveries

Fields:

```text
id
tenant_id
webhook_subscription_id
outbox_event_id
attempt_number
request_headers_json
response_status
response_body_excerpt
sent_at
completed_at
status
next_retry_at
```

---

## 32.5 integration.idempotency_keys

Fields:

```text
id
tenant_id
idempotency_key
request_hash
operation_type
response_status
response_body_json
resource_type
resource_id
created_at
expires_at
```

Constraint:

```text
UNIQUE (tenant_id, idempotency_key)
```

---

# 33. Reporting Tables

## 33.1 reporting.saved_reports

Fields:

```text
id
tenant_id
user_id
report_code
name
filters_json
columns_json
sort_json
is_shared
created_at
updated_at
```

---

## 33.2 reporting.scheduled_reports

Fields:

```text
id
tenant_id
report_code
schedule_expression
filters_json
format
delivery_method
recipients_json
status
last_run_at
next_run_at
created_by
```

---

## 33.3 reporting.export_jobs

Fields:

```text
id
tenant_id
user_id
report_code
filters_json
format
status
progress_percent
file_id
error_message
requested_at
completed_at
expires_at
```

---

# 34. Common Relationship Overview

```text
Tenant
├── Users
├── Companies
│   ├── Branches
│   ├── Departments
│   ├── Cost Centers
│   ├── Warehouses
│   ├── Fiscal Periods
│   └── Accounts
│
├── Parties
│   ├── Customers
│   └── Suppliers
│
├── Products
│   ├── Categories
│   ├── Units
│   ├── Lots
│   └── Serial Numbers
│
├── CRM
│   ├── Leads
│   ├── Opportunities
│   └── Activities
│
├── Sales
│   ├── Quotations
│   ├── Sales Orders
│   ├── Deliveries
│   ├── Customer Invoices
│   └── Customer Payments
│
├── Procurement
│   ├── Purchase Requests
│   ├── RFQs
│   ├── Purchase Orders
│   ├── Goods Receipts
│   ├── Supplier Invoices
│   └── Supplier Payments
│
├── Inventory
│   ├── Movements
│   ├── Reservations
│   ├── Balances
│   └── Valuation Layers
│
└── Finance
    ├── Journal Entries
    ├── Journal Lines
    ├── Receivable Ledger
    ├── Payable Ledger
    └── Bank Reconciliation
```

---

# 35. Lead-to-Cash Relationship Flow

```text
crm.leads
    ↓
crm.opportunities
    ↓
sales.customers
    ↓
sales.quotations
    ↓
sales.sales_orders
    ↓
inventory.stock_reservations
    ↓
warehouse.delivery_notes
    ↓
inventory.stock_movements
    ↓
finance.customer_invoices
    ↓
finance.journal_entries
    ↓
finance.payments
    ↓
finance.payment_allocations
```

---

# 36. Procure-to-Pay Relationship Flow

```text
procurement.purchase_requests
    ↓
procurement.requests_for_quotation
    ↓
procurement.supplier_quotations
    ↓
procurement.purchase_orders
    ↓
warehouse.goods_receipts
    ↓
inventory.stock_movements
    ↓
finance.supplier_invoices
    ↓
finance.journal_entries
    ↓
finance.payments
    ↓
finance.payment_allocations
```

---

# 37. Accounting Posting Relationships

## Sales Invoice Posting

```text
customer_invoice
    ↓
journal_entry
    ├── Debit Accounts Receivable
    ├── Credit Sales Revenue
    └── Credit Tax Payable
```

## Sales Delivery Posting

```text
delivery_note
    ↓
stock_movement
    ↓
journal_entry
    ├── Debit Cost of Goods Sold
    └── Credit Inventory
```

## Purchase Receipt Posting

Depending on configuration:

```text
goods_receipt
    ↓
stock_movement
    ↓
journal_entry
    ├── Debit Inventory
    └── Credit Goods Received Not Invoiced
```

## Supplier Invoice Posting

```text
supplier_invoice
    ↓
journal_entry
    ├── Debit Expense / Inventory Clearing
    ├── Debit Recoverable Tax
    └── Credit Accounts Payable
```

---

# 38. Tenant Isolation Constraints

Every business relationship must verify tenant ownership.

Example logical relationship:

```text
sales_order.tenant_id = customer.tenant_id
sales_order.tenant_id = company.tenant_id
sales_order.tenant_id = warehouse.tenant_id
```

Recommended approaches:

1. Repository-level tenant filters
2. Composite unique keys
3. Composite foreign keys where practical
4. PostgreSQL Row-Level Security
5. Automated tenant-isolation tests
6. Trusted server-side tenant context

Example composite key design:

```text
customers:
UNIQUE (tenant_id, id)

sales_orders:
FOREIGN KEY (tenant_id, customer_id)
REFERENCES customers (tenant_id, id)
```

Because `id` is globally unique, this may appear redundant, but it provides stronger database enforcement.

---

# 39. Row-Level Security Direction

Potential PostgreSQL policy:

```text
tenant_id = current_setting('app.current_tenant_id')::uuid
```

Before running tenant queries, the application transaction sets:

```text
SET LOCAL app.current_tenant_id = '...';
```

Row-Level Security should be treated as additional protection.

It does not replace:

* Permission checks
* Company access
* Branch access
* Field restrictions
* Workflow authority

---

# 40. Indexing Strategy

## 40.1 Tenant-First Indexing

Most business indexes should begin with:

```text
tenant_id
```

Examples:

```text
(tenant_id, status)
(tenant_id, company_id, posting_date)
(tenant_id, customer_id, status)
```

---

## 40.2 Document Search Indexes

Examples:

```text
sales_orders:
(tenant_id, company_id, sales_order_number)

purchase_orders:
(tenant_id, company_id, purchase_order_number)

customer_invoices:
(tenant_id, company_id, invoice_number)
```

---

## 40.3 Date-Based Indexes

Useful for reports:

```text
(tenant_id, company_id, posting_date)
(tenant_id, created_at)
(tenant_id, due_date, status)
```

---

## 40.4 Foreign Key Indexes

PostgreSQL does not automatically create indexes for all foreign keys.

Indexes should be added for frequently joined foreign keys such as:

```text
customer_id
supplier_id
product_id
sales_order_id
purchase_order_id
journal_entry_id
warehouse_id
```

---

## 40.5 Partial Indexes

Examples:

```text
WHERE status = 'PENDING_APPROVAL'
WHERE outstanding_amount > 0
WHERE processed_at IS NULL
WHERE revoked_at IS NULL
```

These may improve:

* Pending approvals
* Outstanding invoices
* Unprocessed outbox events
* Active sessions

---

# 41. High-Volume Tables

Likely high-volume tables:

* journal_lines
* stock_movement_lines
* audit_events
* notification_delivery_jobs
* integration_outbox_events
* bank_statement_lines
* payment_allocations
* warehouse_tasks

These tables require:

* Strong indexing
* Archival planning
* Query monitoring
* Possible future partitioning

---

# 42. Partitioning Direction

Partitioning should not be introduced before actual scale requires it.

Likely future partition candidates:

## Audit Events

Partition by month or quarter.

## Journal Lines

Partition by company and fiscal year or posting date.

## Stock Movements

Partition by posting date.

## Integration Logs

Partition by month.

The application must not depend on a specific physical partition layout.

---

# 43. Concurrency Fields

Mutable aggregates should include:

```text
version INTEGER NOT NULL DEFAULT 1
```

Updates use:

```text
WHERE id = :id
AND tenant_id = :tenantId
AND version = :expectedVersion
```

Successful update:

```text
version = version + 1
```

This prevents silent lost updates.

---

# 44. Document Sequence Tables

## 44.1 platform.document_sequences

Fields:

```text
id
tenant_id
company_id
branch_id
document_type
prefix_template
current_number
padding_length
reset_policy
last_reset_at
fiscal_year_id
version
```

Constraint:

```text
UNIQUE (
  tenant_id,
  company_id,
  branch_id,
  document_type,
  fiscal_year_id
)
```

Reset policies:

```text
NEVER
YEARLY
MONTHLY
FISCAL_YEAR
```

Document number generation must use row locking or another concurrency-safe mechanism.

---

# 45. Status History Tables

Important business documents should store status history.

Common structure:

```text
id
tenant_id
document_id
previous_status
new_status
reason
changed_by
changed_at
correlation_id
```

Applicable documents:

* Customer
* Supplier
* Sales order
* Purchase order
* Invoice
* Payment
* Workflow
* Inventory adjustment

---

# 46. Snapshot Fields

Historical documents should store important values as snapshots.

Examples:

```text
customer_name_snapshot
billing_address_snapshot
shipping_address_snapshot
product_description_snapshot
supplier_name_snapshot
payment_terms_snapshot
tax_rate_snapshot
```

This ensures that old documents remain accurate after master data changes.

---

# 47. JSONB Usage Rules

PostgreSQL JSONB may be used for:

* Configurable workflow conditions
* Tenant settings
* Integration payloads
* Audit value snapshots
* Report filters
* Custom field values
* Provider metadata

JSONB should not replace relational design for:

* Journal lines
* Stock movements
* Invoice lines
* Sales order lines
* Customer balances
* Product relationships
* Core permissions

Use relational columns for frequently filtered and validated business data.

---

# 48. Custom Fields Direction

Future custom-field support may include:

## platform.custom_field_definitions

```text
id
tenant_id
entity_type
field_code
label
data_type
is_required
validation_json
options_json
display_order
status
```

## platform.custom_field_values

```text
id
tenant_id
entity_type
entity_id
field_definition_id
value_text
value_number
value_date
value_boolean
value_json
```

Custom fields must not be allowed to bypass core business integrity.

---

# 49. Soft Deletion Rules

Soft deletion may be used for draft or administrative records.

Common field:

```text
deleted_at
deleted_by
```

However, soft deletion must not be used as a substitute for valid business cancellation.

Examples:

* A posted invoice must be reversed, not soft-deleted.
* A stock movement must be reversed, not soft-deleted.
* A journal entry must be reversed, not soft-deleted.
* A completed payment must be reversed, not soft-deleted.

---

# 50. Financial Integrity Rules

The database and application must enforce:

1. Every posted journal is balanced.
2. Every journal line belongs to one journal entry.
3. Posting accounts must be active.
4. Posting date belongs to an open fiscal period.
5. A posted entry cannot be directly updated.
6. Reversal entries reference original entries.
7. Customer invoices create receivable impact.
8. Supplier invoices create payable impact.
9. Payments create accounting entries.
10. Currency and exchange rate are stored at posting time.

---

# 51. Inventory Integrity Rules

The system must enforce:

1. Every stock change has a stock movement.
2. Movement quantity is positive.
3. Transfers have valid source and destination.
4. Serial numbers cannot be duplicated.
5. Lot-tracked products require lots.
6. Serial-tracked products require serial numbers.
7. Reservations cannot exceed available stock unless policy allows.
8. Posted movements cannot be edited.
9. Inventory adjustments require reasons.
10. Valuation layers link to movement lines.

---

# 52. Three-Way Matching Tables

A dedicated match-result table may be used.

## finance.invoice_match_results

Fields:

```text
id
tenant_id
supplier_invoice_id
supplier_invoice_line_id
purchase_order_line_id
goods_receipt_line_id
ordered_quantity
received_quantity
invoiced_quantity
ordered_unit_price
invoiced_unit_price
quantity_variance
price_variance
tax_variance
match_status
exception_reason
approved_by
approved_at
```

Statuses:

```text
MATCHED
WITHIN_TOLERANCE
QUANTITY_EXCEPTION
PRICE_EXCEPTION
MISSING_RECEIPT
MISSING_ORDER
BLOCKED
APPROVED_EXCEPTION
```

---

# 53. Opening Balance Tables

Opening balances should be imported through controlled transactions.

## finance.opening_balance_batches

Fields:

```text
id
tenant_id
company_id
batch_number
fiscal_year_id
status
created_by
approved_by
posted_by
created_at
posted_at
```

## finance.opening_balance_lines

Fields:

```text
id
tenant_id
opening_balance_batch_id
account_id
customer_id
supplier_id
debit_amount
credit_amount
currency_id
due_date
reference
```

Opening stock should similarly create stock movements and valuation layers.

---

# 54. Database Migration Strategy

All schema changes must use version-controlled migrations.

Migration rules:

* Migrations must be repeatable across environments.
* Production migrations must be reviewed.
* Destructive migrations require explicit approval.
* Large table changes should avoid long blocking operations.
* New required columns may need staged deployment.
* Index creation on large tables may use concurrent creation.
* Data migrations must be separated from application logic where possible.

---

# 55. Seed Data Strategy

Seed data may include:

* System permissions
* Standard module codes
* Default workflow statuses
* Currency list
* Country list
* Account types
* Standard journal types
* Notification types
* Default roles

Tenant-specific business data should not be mixed with global system seed data.

---

# 56. Referential Deletion Strategy

Recommended foreign-key actions:

## RESTRICT

Use for:

* Customer referenced by invoices
* Supplier referenced by purchase orders
* Product referenced by stock movements
* Account referenced by journal lines
* Company referenced by transactions

## CASCADE

Use carefully for dependent records that cannot exist independently.

Examples:

* Quotation lines when deleting a draft quotation
* Role permissions when deleting a custom role
* Temporary import rows when deleting an import batch

## SET NULL

Use where historical records may remain valid without the related optional record.

Examples:

* Assigned salesperson after user deactivation
* Manager reference after employee departure

---

# 57. MVP Database Scope

The first MVP must implement these table groups:

## Platform

* tenants
* tenant_modules
* tenant_settings
* document_sequences

## Identity

* users
* user_sessions
* roles
* permissions
* role_permissions
* user_roles
* delegations

## Organization

* companies
* branches
* departments
* cost_centers
* fiscal_years
* fiscal_periods
* currencies
* exchange_rates
* addresses
* parties
* party_contacts

## CRM and Sales

* leads
* opportunities
* customers
* customer_groups
* price_lists
* price_list_items
* quotations
* quotation_lines
* sales_orders
* sales_order_lines
* sales_returns

## Procurement

* suppliers
* supplier_categories
* purchase_requests
* purchase_request_lines
* requests_for_quotation
* supplier_quotations
* purchase_orders
* purchase_order_lines
* purchase_returns

## Product and Inventory

* products
* product_categories
* units_of_measure
* uom_conversions
* warehouses
* locations
* goods_receipts
* goods_receipt_lines
* delivery_notes
* delivery_note_lines
* stock_movements
* stock_movement_lines
* stock_balances
* stock_reservations
* inventory_lots
* serial_numbers
* valuation_layers
* inventory_adjustments

## Finance

* accounts
* account_types
* journals
* journal_entries
* journal_lines
* customer_invoices
* customer_invoice_lines
* supplier_invoices
* supplier_invoice_lines
* payments
* payment_allocations
* payment_methods
* bank_accounts
* cash_accounts

## Platform Services

* workflow_definitions
* workflow_versions
* workflow_instances
* approval_tasks
* approval_history
* audit_events
* files
* file_links
* notifications
* notification_delivery_jobs
* outbox_events
* processed_events
* idempotency_keys

---

# 58. Deferred Database Scope

The following tables may be designed later:

* HR
* Recruitment
* Attendance
* Leave
* Payroll
* Fixed assets
* Budgets
* Manufacturing
* Bills of materials
* Work centers
* Production orders
* Quality inspections
* Maintenance
* Projects
* Timesheets
* Customer service
* Transportation
* Advanced demand planning
* Analytical warehouse

---

# 59. Database Validation Scenarios

## Scenario 1: Cross-Tenant Customer Access

A sales order from Tenant A references a customer from Tenant B.

Expected result:

```text
Database or repository validation rejects the relationship.
```

## Scenario 2: Duplicate Product Code

Two products in the same tenant use the same product code.

Expected result:

```text
Unique constraint rejects the duplicate.
```

## Scenario 3: Unbalanced Journal

A journal has debit 1,000 and credit 900.

Expected result:

```text
Posting fails.
Journal remains unposted.
```

## Scenario 4: Duplicate Serial Number

The same serial number is assigned twice.

Expected result:

```text
Unique constraint rejects the second serial number.
```

## Scenario 5: Concurrent Reservation

Two orders reserve the final stock quantity.

Expected result:

```text
Only one transaction succeeds.
The second receives an insufficient-stock conflict.
```

## Scenario 6: Closed Fiscal Period

A user posts an invoice into a closed period.

Expected result:

```text
Posting is rejected.
```

## Scenario 7: Supplier Invoice without Receipt

A three-way-match-required invoice has no goods receipt.

Expected result:

```text
Invoice matching status becomes blocked or exception.
Payment cannot proceed without approved override.
```

---

# 60. Database Definition of Done

The database design phase is complete when:

* Table ownership is approved.
* Tenant ownership rules are accepted.
* Organization hierarchy is represented.
* Customer and supplier master models are approved.
* Product and pricing models are approved.
* Sales and procurement relationships are approved.
* Inventory movement and valuation models are approved.
* Finance journal and subledger models are approved.
* Workflow and audit models are approved.
* Primary and foreign keys are defined.
* Unique constraints are identified.
* Required indexes are identified.
* Deletion behaviour is documented.
* Concurrency strategy is accepted.
* Migration strategy is accepted.
* MVP table scope is approved.
* The model is ready for physical ERD creation and ORM schema implementation.

---

# 61. Database Decision Summary

```text
Database:
PostgreSQL

Primary Key:
UUID

Naming:
Plural snake_case tables and snake_case columns

Tenant Model:
Shared database with tenant_id ownership

Organization Model:
Tenant → Company → Branch → Department / Cost Center

Finance:
Double-entry general ledger

Inventory:
Movement and valuation ledger

Historical Accuracy:
Snapshot transaction values

Concurrency:
Optimistic versioning and database locking where required

Documents:
Business number separate from internal UUID

Deletion:
Restrict, deactivate or reverse depending on record type

Events:
Transactional outbox tables

Security:
Application authorization plus optional Row-Level Security

Reporting:
Transactional source with optimized read models
```

---

# 62. Next Documentation Stage

## Part 5: Detailed Module Workflows, State Machines and Accounting Impact

The next document will define:

1. Lead-to-cash workflow
2. Procure-to-pay workflow
3. Inventory receiving workflow
4. Sales fulfilment workflow
5. Customer-return workflow
6. Supplier-return workflow
7. Customer-invoice lifecycle
8. Supplier-invoice lifecycle
9. Payment and receipt lifecycle
10. Stock-transfer workflow
11. Inventory-adjustment workflow
12. Approval state machines
13. Document cancellation and reversal rules
14. Accounting entries for each transaction
15. Inventory effects for each transaction
16. Failure and exception handling
17. Cross-module events
18. End-to-end acceptance scenarios
