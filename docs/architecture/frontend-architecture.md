# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 8: Frontend Architecture, User Experience and Design System

**Document Status:** Initial Frontend Architecture Draft
**Depends On:**

* Part 1 — Product Vision and Business Scope
* Part 2 — Detailed Business Requirements
* Part 3 — System Architecture and Domain Design
* Part 4 — Database Domain Model and ERD Design
* Part 5 — Detailed Module Workflows and Accounting Impact
* Part 6 — Security, Multi-Tenancy, Access Control and Compliance Design
* Part 7 — API Design, Integration Contracts and Event Architecture

**Frontend Framework:** React
**Language:** TypeScript
**Build Tool:** Vite
**Styling:** Tailwind CSS
**Component System:** shadcn/ui and Radix UI
**Server-State Management:** TanStack Query
**Client-State Management:** Zustand
**Form Management:** React Hook Form and Zod
**Table System:** TanStack Table
**Charting:** Recharts

---

# 1. Purpose of This Document

This document defines the frontend architecture and user-experience strategy for the ERP platform.

It explains:

* How the application shell should work
* How users switch tenants, companies and branches
* How modules appear in navigation
* How role-specific workspaces are designed
* How dashboards, tables and forms behave
* How permissions affect the user interface
* How financial and inventory transactions are presented
* How loading, errors and empty states are handled
* How the design system remains consistent
* How accessibility and internationalization are supported
* How the frontend communicates with the backend securely

The objective is to build an ERP interface that is powerful without being unnecessarily difficult to use.

---

# 2. Frontend Design Goals

The frontend should achieve the following goals:

1. Make common tasks fast.
2. Make complex workflows understandable.
3. Prevent accidental high-risk actions.
4. Display business state clearly.
5. Support large datasets.
6. Adapt to user roles.
7. Work across desktop and tablet.
8. Remain usable on unstable networks.
9. Support multiple languages.
10. Preserve visual consistency across modules.
11. Make errors actionable.
12. Support keyboard-driven professional users.
13. Separate operational work from administrative configuration.
14. Keep sensitive data hidden unless authorized.
15. Provide direct traceability between related documents.

---

# 3. User Experience Principles

## 3.1 Task-Oriented Design

Screens should focus on business tasks rather than database entities.

Good examples:

* Create quotation
* Approve purchase order
* Receive goods
* Post customer invoice
* Reconcile bank statement
* Review low stock

Avoid designing every page as a generic CRUD table.

---

## 3.2 Progressive Disclosure

Show essential information first.

Advanced details should appear through:

* Tabs
* Expandable sections
* Side panels
* Advanced settings
* Role-specific sections

A storekeeper should not see accounting configuration on a receiving screen.

---

## 3.3 Visible Business State

Every business document should clearly display:

* Document status
* Approval status
* Posting status
* Payment status
* Fulfilment status
* Warning conditions
* Related documents

Example:

```text id="7xg2y4"
Sales Order SO-MOG-2026-000125

Overall Status: Partially Delivered
Approval: Approved
Reservation: Fully Reserved
Delivery: 60%
Invoice: Not Invoiced
Payment: Not Applicable
```

---

## 3.4 Safe High-Risk Actions

Sensitive actions should require clear confirmation.

Examples:

* Post journal
* Reverse payment
* Reopen fiscal period
* Cancel delivery
* Change supplier bank details
* Approve payroll

Confirmation should explain the business impact.

---

## 3.5 Traceability

Users should be able to navigate from one document to related documents.

Example:

```text id="rmsbf7"
Lead
→ Opportunity
→ Quotation
→ Sales Order
→ Delivery
→ Invoice
→ Payment
→ Journal Entry
```

Related documents should appear in a visible relationship panel.

---

# 4. Frontend Technology Stack

Recommended stack:

```text id="cxs4sh"
React
TypeScript
Vite
React Router
TanStack Query
Zustand
React Hook Form
Zod
Tailwind CSS
shadcn/ui
Radix UI
TanStack Table
Recharts
Lucide React
date-fns
```

Optional additions:

* i18next for internationalization
* Socket.IO Client for real-time events
* Axios or a typed fetch wrapper
* MSW for frontend API mocking
* Vitest
* React Testing Library
* Playwright

---

# 5. Application Shell

The ERP application should use a persistent application shell.

```text id="x0lo3x"
┌──────────────────────────────────────────────────────────┐
│ Top Header                                               │
├───────────────┬──────────────────────────────────────────┤
│ Sidebar       │ Main Workspace                           │
│ Navigation    │                                          │
│               │ Page Header                              │
│               │ Filters / Actions                        │
│               │ Page Content                             │
│               │                                          │
└───────────────┴──────────────────────────────────────────┘
```

Main shell components:

* Global header
* Sidebar
* Context switcher
* Command palette
* Notification center
* Approval inbox indicator
* User menu
* Breadcrumbs
* Main content region
* Optional right-side activity panel

---

# 6. Global Header

The header should contain:

* Current tenant
* Current company
* Current branch
* Global search
* Quick-create button
* Approval notifications
* General notifications
* Help
* User profile menu

Example:

```text id="9z2n37"
[Company: Hurbad Trading] [Branch: Mogadishu]
[Search] [+ Create]
[Approvals 4] [Notifications 7] [User]
```

---

# 7. Tenant, Company and Branch Switching

## 7.1 Tenant Switcher

Display only when the user belongs to multiple tenants.

Tenant switching must:

* Verify membership
* Refresh access context
* Clear tenant-scoped caches
* Reload navigation
* Refresh permissions
* Close tenant-specific tabs
* Audit the switch

## 7.2 Company Switcher

The selected company affects:

* Transactions
* Reports
* Fiscal periods
* Currency
* Accounts
* Warehouses
* Document sequences

## 7.3 Branch Switcher

The branch switcher affects:

* Operational records
* Warehouse access
* Cash accounts
* User workspace
* Reports

## 7.4 Context Visibility

The active context should always be visible.

Users must not accidentally enter transactions in the wrong company or branch.

---

# 8. Sidebar Navigation

Navigation should be module-based.

```text id="kaft82"
Home
CRM
Sales
Procurement
Inventory
Warehouse
Finance
Human Resources
Payroll
Projects
Assets
Manufacturing
Reports
Approvals
Administration
```

Each module may expand.

Example:

```text id="40m51h"
Sales
├── Overview
├── Customers
├── Quotations
├── Sales Orders
├── Deliveries
├── Returns
├── Price Lists
└── Sales Reports
```

The sidebar must only show modules and actions the user can access.

---

# 9. Navigation Rules

## 9.1 Permission-Aware Navigation

If the user lacks `purchase_order.view`, purchase orders should not appear in navigation.

However, backend authorization remains mandatory.

## 9.2 Role-Focused Navigation

A cashier may see:

```text id="kqlv3u"
Dashboard
Customer Receipts
Cash Register
Customer Search
Daily Closing
```

A finance manager may see:

```text id="ug8ndg"
Finance Dashboard
General Ledger
Receivables
Payables
Banking
Budgets
Financial Reports
Period Closing
```

## 9.3 Favorites

Users may pin frequently used pages.

## 9.4 Recent Pages

The system may show recently visited records and pages.

---

# 10. Role-Based Workspaces

A workspace is a role-focused home area.

## 10.1 Executive Workspace

Displays:

* Revenue
* Gross profit
* Net profit
* Cash position
* Receivables
* Payables
* Inventory value
* Sales pipeline
* Branch performance
* Pending strategic approvals

## 10.2 Sales Workspace

Displays:

* My leads
* My opportunities
* Quotations awaiting follow-up
* Orders on hold
* Reservation failures
* Sales targets
* Recent customers

## 10.3 Procurement Workspace

Displays:

* Purchase requests awaiting action
* RFQs
* Supplier responses
* Delayed purchase orders
* Supplier performance
* Procurement commitments

## 10.4 Warehouse Workspace

Displays:

* Receipts due today
* Picking tasks
* Packing tasks
* Transfers
* Stock count tasks
* Quarantine items
* Low-stock alerts

## 10.5 Finance Workspace

Displays:

* Unposted journals
* Invoices awaiting approval
* Overdue receivables
* Supplier payments due
* Unreconciled bank lines
* Period-closing tasks
* Cash position

---

# 11. Dashboard Design

Dashboards should combine:

* KPI cards
* Trend charts
* Status summaries
* Task lists
* Alerts
* Drill-down links

Example cards:

```text id="3xd742"
Revenue This Month: $125,000
Outstanding Receivables: $28,400
Inventory Value: $76,800
Pending Approvals: 12
```

Every dashboard value should link to the underlying report or transaction list.

---

# 12. Dashboard Rules

1. Use business-relevant metrics.
2. Avoid decorative charts without decisions.
3. Display comparison periods.
4. Show data freshness.
5. Respect tenant and company scope.
6. Respect field-level permissions.
7. Support drill-down.
8. Avoid loading all dashboard data in one request.
9. Lazy-load lower-priority widgets.
10. Show clear empty states.

---

# 13. Page Header Standard

Every major page should include:

* Page title
* Business context
* Breadcrumb
* Primary action
* Secondary actions
* Status
* Last updated information

Example:

```text id="zoh8ey"
Sales Orders

Company: Hurbad Trading
Branch: Mogadishu

[Create Sales Order] [Export] [Saved Views]
```

Document page:

```text id="7g2seu"
Sales Order SO-MOG-2026-000125
Customer: Hodan Supermarket
Status: Confirmed

[Reserve Stock] [Create Delivery] [More]
```

---

# 14. List Page Architecture

A list page should contain:

* Search
* Filters
* Saved views
* Table
* Bulk actions
* Pagination
* Export
* Column customization

Example:

```text id="0o2cpe"
Sales Orders

Search: [________]
Filters: Status | Customer | Date | Branch
Saved View: My Open Orders

Table
Pagination
```

---

# 15. Table Architecture

Tables must support:

* Sorting
* Filtering
* Pagination
* Column visibility
* Column pinning
* Row selection
* Bulk actions
* Keyboard navigation
* Responsive overflow
* Saved views

For large lists, use server-side:

* Pagination
* Sorting
* Filtering
* Search

Do not load thousands of rows into the browser.

---

# 16. Table Column Design

Display high-value columns first.

Example sales order list:

```text id="h1brmd"
Order Number
Customer
Order Date
Delivery Date
Total
Reservation
Delivery
Invoice
Status
Salesperson
```

Avoid displaying every database field.

Sensitive columns should require permission.

---

# 17. Saved Views

Users may save filters and columns.

Examples:

* My pending quotations
* Overdue invoices
* Low-stock products
* Unmatched supplier invoices
* Pending branch approvals

Saved views may be:

* Private
* Shared with role
* Shared with department
* Tenant-defined defaults

---

# 18. Form Architecture

Forms should use:

* React Hook Form
* Zod validation
* Typed API requests
* Field-level error messages
* Autosave where safe
* Unsaved-change warning
* Keyboard navigation

Forms should be divided into logical sections.

Example sales order:

```text id="zeavz6"
Customer Information
Order Details
Products
Pricing
Delivery
Accounting Dimensions
Terms
Attachments
```

---

# 19. Form Validation

Validation occurs in two layers.

## Client Validation

Used for:

* Required fields
* Data format
* Immediate feedback
* Minimum and maximum values

## Server Validation

Authoritative for:

* Permissions
* Tenant context
* Credit limits
* Pricing
* Taxes
* Stock
* Fiscal periods
* Workflow
* Accounting

Server errors should map back to fields when possible.

---

# 20. Document Line Editor

Documents such as sales orders and invoices require line-item editors.

Features:

* Product search
* Barcode input
* UOM selection
* Quantity
* Price
* Discount
* Tax
* Warehouse
* Delivery date
* Line notes
* Keyboard shortcuts
* Copy line
* Delete draft line
* Reorder lines

Calculated totals should be visible but clearly marked as pending server confirmation until saved.

---

# 21. Product Search Experience

Product lookup should show:

* SKU
* Product name
* Unit
* Available stock
* Reserved stock
* Selling price
* Warehouse
* Lot or serial requirements
* Status

Example:

```text id="ch4pjm"
PRD-001 — Premium Rice 25kg
Available: 120 Bags
Price: $24.00
Warehouse: Main Warehouse
```

Sensitive cost information appears only for authorized roles.

---

# 22. Customer Search Experience

Customer lookup should show:

* Customer number
* Name
* Status
* Credit status
* Outstanding balance
* Assigned salesperson
* Branch

Example warning:

```text id="q753mt"
Customer is credit blocked.
New credit orders require Finance approval.
```

---

# 23. Status Components

Use consistent status badges.

Examples:

```text id="py5hci"
Draft
Pending Approval
Approved
Confirmed
Partially Delivered
Posted
Paid
Overdue
Cancelled
Reversed
```

Statuses should use:

* Text
* Icon where useful
* Accessible contrast
* Tooltips for meaning

Color alone must not communicate status.

---

# 24. Approval Inbox

The approval inbox should be a dedicated workspace.

Display:

* Document type
* Document number
* Requester
* Amount
* Currency
* Company
* Branch
* Age
* Due date
* Risk warnings

Actions:

* Open
* Approve
* Reject
* Return
* Delegate
* Request information

Approvers should see the key business context without navigating through many pages.

---

# 25. Approval Detail Panel

Before approval, show:

* Document summary
* Changes
* Budget impact
* Credit impact
* Supplier risk
* Previous approvals
* Attachments
* Audit history
* Policy warnings

High-value approvals may require:

* Reauthentication
* MFA
* Mandatory comments

---

# 26. Notification Center

Notification center categories:

* Approvals
* Tasks
* Alerts
* System notices
* Security notices
* Integration failures

Each notification should contain:

* Title
* Short message
* Timestamp
* Priority
* Related record
* Read status
* Action link

Users may mark:

* Read
* Unread
* All read
* Archive

---

# 27. Real-Time Updates

Use WebSocket or Socket.IO for:

* New approvals
* New notifications
* Job progress
* Import progress
* Export completion
* Stock alerts
* Session-security alerts

Real-time updates should invalidate relevant TanStack Query caches rather than directly modifying complex page state when possible.

---

# 28. Global Search

Global search should support:

* Customers
* Suppliers
* Products
* Employees
* Sales orders
* Purchase orders
* Invoices
* Payments
* Journal entries

Search result groups:

```text id="tpj67f"
Customers
Products
Sales Orders
Invoices
```

Search results must respect authorization.

---

# 29. Command Palette

Keyboard shortcut example:

```text id="0qdfux"
Ctrl + K
```

Commands may include:

* Create sales order
* Create purchase request
* Open customer
* Go to inventory
* View pending approvals
* Switch company
* Search invoice

Only authorized commands should appear.

---

# 30. Document Relationship Panel

Document detail pages should include a relationship graph or linked list.

Example:

```text id="0by6fr"
Source:
Quotation QT-2026-0012

Downstream:
Delivery DN-2026-0085
Invoice INV-2026-0230
Payment PAY-2026-0104
Journal JE-2026-0560
```

Each item should be clickable if the user has permission.

---

# 31. Activity Timeline

A business document should show a timeline.

Example:

```text id="ug0azh"
10:15 — Created by Mohamed
10:32 — Submitted
11:05 — Approved by Finance Manager
11:12 — Confirmed
11:14 — Stock reserved
13:20 — Delivery created
```

Timeline may combine:

* Status history
* Approvals
* Comments
* Attachments
* Notifications
* Related events

---

# 32. Audit View

Authorized users may view:

* Previous values
* New values
* Actor
* Time
* Reason
* Correlation ID

Sensitive values remain masked.

Audit views should be read-only.

---

# 33. Finance User Experience

Finance screens require precision.

## 33.1 Journal Entry Form

Display:

* Journal
* Posting date
* Currency
* Description
* Lines
* Debit total
* Credit total
* Difference

The difference should be visible.

```text id="nby8sw"
Total Debit:  $5,000.00
Total Credit: $4,900.00
Difference:     $100.00
```

Posting remains disabled until balanced.

## 33.2 Fiscal Period Warning

If posting date is closed:

```text id="5lgb7r"
Posting is not allowed because July 2026 is closed.
```

## 33.3 Reversal Flow

The reversal dialog should show:

* Original entry
* Reversal date
* Reason
* Expected opposite entry
* Downstream impact

---

# 34. Accounts Receivable Experience

Customer invoice detail should display:

* Invoice total
* Paid amount
* Outstanding amount
* Due date
* Aging status
* Payment allocations
* Credit notes
* Journal entry

Example:

```text id="fm8bz1"
Invoice Total:      $1,150.00
Paid:                 $500.00
Outstanding:          $650.00
Status: Partially Paid
```

---

# 35. Accounts Payable Experience

Supplier invoice screen should display:

* Supplier invoice
* Purchase order
* Goods receipt
* Matching status
* Variances
* Payment status
* Approval status

Three-way match panel:

```text id="1n9wqf"
Ordered: 100 units
Received: 90 units
Invoiced: 100 units

Result: Quantity Exception
```

---

# 36. Inventory User Experience

Inventory screens should clearly separate:

```text id="9d4fkj"
On Hand
Reserved
Available
Incoming
Outgoing
Quarantine
Damaged
```

A single quantity field is not sufficient.

Example:

```text id="4ykjnz"
On Hand:     100
Reserved:     25
Available:    75
Incoming:     40
Quarantine:    5
```

---

# 37. Warehouse User Experience

Warehouse pages should be optimized for operational speed.

Features:

* Large touch-friendly actions
* Barcode scanning
* Product image where useful
* Location confirmation
* Quantity confirmation
* Lot and serial capture
* Minimal unnecessary fields

Task screen example:

```text id="quzr3y"
Pick Task PK-2026-0041

Product: PRD-001
From: Aisle A / Rack 2 / Bin 04
Required: 10
Picked: [  ]
[Scan Product] [Confirm]
```

---

# 38. Barcode Workflow

Barcode input should support:

* Product identification
* UOM identification
* Location identification
* Lot identification
* Serial identification
* Package identification

The frontend must provide clear errors:

```text id="x1v83m"
This serial number is already delivered.
```

```text id="sonpuk"
The scanned product does not match the task.
```

---

# 39. CRM User Experience

CRM should support pipeline and list views.

Pipeline:

```text id="6w93yo"
Qualification
Needs Analysis
Proposal
Negotiation
Won
```

Cards may display:

* Opportunity
* Customer
* Value
* Expected close date
* Owner
* Last activity
* Next action

Drag-and-drop stage changes must still call backend business commands and validations.

---

# 40. Responsive Design

Primary target:

* Desktop
* Laptop
* Tablet

Mobile support may initially focus on:

* Approvals
* Notifications
* Warehouse tasks
* Customer lookup
* Simple dashboards

Complex journal, reporting and configuration screens may remain desktop-first.

---

# 41. Layout Breakpoints

Recommended behaviour:

## Desktop

* Full sidebar
* Multi-column forms
* Wide tables
* Persistent context panels

## Tablet

* Collapsible sidebar
* Reduced columns
* Drawer filters
* Touch-friendly controls

## Mobile

* Bottom or drawer navigation
* Single-column forms
* Card lists instead of wide tables
* Limited high-priority tasks

---

# 42. Accessibility

The application should target WCAG 2.1 AA principles.

Requirements:

* Keyboard navigation
* Focus indicators
* Form labels
* Accessible error messages
* Screen-reader-friendly status
* Sufficient contrast
* Non-color status indicators
* Semantic headings
* Accessible dialogs
* Reduced-motion support

---

# 43. Keyboard Navigation

Professional ERP users benefit from keyboard workflows.

Examples:

* `Ctrl + K`: command palette
* `Ctrl + S`: save draft
* `Alt + N`: new record
* `Esc`: close dialog
* Arrow keys: table movement
* Enter: open selected record

Shortcuts should be configurable and not conflict with browser accessibility.

---

# 44. Internationalization

Support:

* English
* Somali
* Future languages

All user-facing text should use translation keys.

Avoid hard-coded strings.

Example:

```text id="ve59fe"
sales.order.status.confirmed
```

---

# 45. Locale Formatting

Support locale-aware:

* Dates
* Time
* Currency
* Numbers
* Percentages
* Decimal separators

Business values should remain stored in standardized backend formats.

Display formatting is a frontend concern.

---

# 46. Right-to-Left Readiness

Even if not part of the first release, components should avoid assumptions that prevent future RTL support.

Use logical CSS properties where practical.

---

# 47. Time Zone Experience

Users should see timestamps in their configured time zone.

Business dates such as:

* Invoice date
* Posting date
* Due date

should remain date-only values.

The UI should distinguish:

```text id="wo9gfb"
Created at: July 25, 2026, 3:30 PM
Posting date: July 25, 2026
```

---

# 48. Server-State Management

TanStack Query should manage:

* API data
* Caching
* Refetching
* Mutations
* Pagination
* Query invalidation
* Background refresh
* Retry behaviour

Query keys must be tenant-aware.

Example:

```text id="nwpwge"
["sales-orders", tenantId, companyId, filters]
```

On tenant switch, old tenant caches must be cleared.

---

# 49. Client-State Management

Zustand may manage:

* Sidebar state
* Theme
* Active workspace
* Local UI preferences
* Command palette
* Unsaved local form state where appropriate

Do not duplicate backend server state unnecessarily in Zustand.

---

# 50. Authentication State

Frontend auth state may contain:

* Current user summary
* Active tenant
* Active company
* Active branch
* Session status
* MFA requirement

Long-lived sensitive refresh tokens should not be exposed to JavaScript when secure cookies are used.

---

# 51. Permission-Aware UI

The frontend should use permission helpers.

Examples:

```text id="0lydru"
can("sales_order.create")
can("purchase_order.approve")
canViewField("product.cost")
```

Permission-aware UI controls:

* Navigation
* Buttons
* Fields
* Columns
* Tabs
* Bulk actions

Backend remains authoritative.

---

# 52. Route Protection

Protected routes should verify:

* Authentication
* Tenant context
* Required module
* Required permission

Example route metadata:

```text id="5tu1ct"
requiredPermission: "sales_order.view"
```

Unauthorized routes should redirect or show a permission page.

---

# 53. API Client Architecture

Create a centralized typed API client.

Responsibilities:

* Base URL
* Authentication
* Correlation IDs
* Error normalization
* Token refresh
* Request cancellation
* Retry policy
* Idempotency keys
* Tenant context headers

Avoid direct raw fetch calls scattered across components.

---

# 54. Token Refresh Behaviour

When an access token expires:

1. Pause eligible requests.
2. Request token refresh once.
3. Retry waiting requests after success.
4. Redirect to login if refresh fails.
5. Avoid infinite refresh loops.

Sensitive commands should not be automatically retried unless idempotency is guaranteed.

---

# 55. Error Handling

Error categories:

* Validation
* Authorization
* Business rule
* Network
* Server
* Conflict
* Session expiry

## Field Errors

Display beside the field.

## Business Errors

Display in page alert or dialog.

Example:

```text id="gh4sfg"
Sales order cannot be confirmed because the customer is credit blocked.
```

## Unexpected Errors

Display:

* Friendly message
* Correlation ID
* Retry option
* Support link where appropriate

---

# 56. Loading States

Use:

* Skeletons
* Button progress
* Inline spinners
* Table loading rows
* Progress bars for jobs

Avoid blank pages.

Long-running commands should display job progress.

---

# 57. Empty States

Empty states should explain:

* What is missing
* Why it matters
* What action to take

Example:

```text id="myqv9b"
No sales orders found.

Create the first sales order or change the current filters.
[Create Sales Order]
```

---

# 58. Offline and Unstable-Network Strategy

The initial ERP remains primarily online.

However, the frontend should support unstable networks through:

* Request timeout messages
* Safe retries for reads
* Draft preservation
* Unsaved-change protection
* Local temporary form storage
* Job continuation after navigation
* Connection-status indicator

High-risk financial and inventory posting should not be completed offline in the initial release.

---

# 59. Draft Preservation

For long forms, the system may preserve draft input locally.

Rules:

* Store tenant and user context
* Encrypt or avoid restricted data
* Expire old drafts
* Clear after successful save
* Warn before restoring another context’s draft

---

# 60. Optimistic Updates

Use optimistic updates only for low-risk actions such as:

* Mark notification read
* Update personal preference
* Reorder dashboard widgets

Avoid optimistic posting for:

* Payments
* Journal posting
* Inventory posting
* Approval
* Credit-limit changes

These require confirmed backend success.

---

# 61. Confirmation Dialogs

Confirmation dialogs should describe consequences.

Weak:

```text id="h18plz"
Are you sure?
```

Better:

```text id="w41smd"
Post Customer Invoice INV-2026-001250?

This will create Accounts Receivable and General Ledger entries.
The invoice cannot be edited after posting.
```

Actions:

* Cancel
* Post invoice

---

# 62. Destructive Action Design

Destructive actions should use:

* Clear label
* Distinct styling
* Consequence explanation
* Reason field
* MFA where required
* Confirmation phrase for critical actions

Examples:

* Reverse journal
* Delete tenant
* Reopen fiscal period
* Cancel posted delivery

---

# 63. Commenting and Collaboration

Documents may support comments.

Features:

* Mention users
* Attach files
* Timestamp
* Edit window
* Resolve comments
* Link to workflow stage

Comments should not replace formal approval actions.

---

# 64. Frontend Folder Structure

```text id="8yqzu8"
client/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── router/
│   │   ├── providers/
│   │   ├── layouts/
│   │   ├── guards/
│   │   └── config/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── administration/
│   │   ├── crm/
│   │   ├── customers/
│   │   ├── sales/
│   │   ├── procurement/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── warehouse/
│   │   ├── finance/
│   │   ├── workflow/
│   │   ├── notifications/
│   │   ├── reporting/
│   │   └── profile/
│   │
│   ├── shared/
│   │   ├── api/
│   │   ├── components/
│   │   ├── design-system/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── charts/
│   │   ├── hooks/
│   │   ├── permissions/
│   │   ├── validation/
│   │   ├── errors/
│   │   ├── i18n/
│   │   ├── utils/
│   │   └── types/
│   │
│   ├── assets/
│   ├── styles/
│   └── main.tsx
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

# 65. Frontend Module Structure

Example:

```text id="rr8e9u"
sales/
├── api/
│   ├── sales.api.ts
│   └── sales.keys.ts
├── components/
├── forms/
├── hooks/
├── pages/
├── schemas/
├── tables/
├── types/
├── utils/
└── routes.tsx
```

Keep business-specific components inside their module.

Move components to shared only when they are genuinely reusable.

---

# 66. Design System Foundations

The design system should define:

* Colors
* Typography
* Spacing
* Radius
* Shadows
* Icons
* Form controls
* Tables
* Dialogs
* Alerts
* Status badges
* Charts

All modules should use the same components.

---

# 67. Color System

Use semantic design tokens.

Examples:

```text id="o4u8md"
background
foreground
primary
secondary
muted
border
success
warning
danger
info
```

Do not hard-code status colors throughout modules.

Support:

* Light mode
* Dark mode
* Tenant accent branding

Tenant branding must not break accessibility contrast.

---

# 68. Typography

Recommended hierarchy:

* Page title
* Section title
* Card title
* Body
* Secondary text
* Label
* Caption
* Monospace document reference

Document numbers may use monospace styling for readability.

---

# 69. Component Standards

Core components:

* Button
* Input
* Textarea
* Select
* Combobox
* Date picker
* Currency input
* Quantity input
* Checkbox
* Radio group
* Table
* Pagination
* Dialog
* Drawer
* Popover
* Tooltip
* Tabs
* Alert
* Badge
* Card
* Skeleton
* Empty state
* Confirm action dialog

---

# 70. Currency Input

Currency inputs should support:

* Currency symbol
* Decimal precision
* Negative-value rules
* Thousand separators
* Backend-safe numeric value
* Base-currency preview where relevant

Example:

```text id="49q11k"
Transaction Amount: $1,150.00
Base Amount:        $1,150.00
Exchange Rate:      1.00000000
```

---

# 71. Quantity Input

Quantity input should understand:

* Unit of measure
* Allowed decimals
* Conversion
* Minimum quantity
* Available quantity

Example:

```text id="uy101r"
Quantity: 10
Unit: Carton
Equivalent: 120 Pieces
```

---

# 72. Date Components

Separate components for:

* Business date
* Timestamp
* Date range
* Fiscal period
* Month picker
* Year picker

The date picker should show fiscal-period warnings where relevant.

---

# 73. Status Badge Standard

Every status should map to:

* Label
* Semantic token
* Optional icon
* Tooltip description

Example:

```text id="bppq4b"
PARTIALLY_PAID
Label: Partially Paid
Semantic type: warning
```

---

# 74. Chart Standards

Charts should:

* Have clear titles
* Show units
* Include accessible labels
* Support tooltips
* Avoid excessive colors
* Link to details
* Display no-data states

Use charts only when visual comparison adds value.

---

# 75. Frontend Testing Strategy

## Unit Tests

Test:

* Utility functions
* Validation schemas
* Permission helpers
* Calculation display
* State helpers

## Component Tests

Test:

* Forms
* Tables
* Dialogs
* Status components
* Error states

## Integration Tests

Test:

* API hooks
* Form submission
* Permission-aware rendering
* Query invalidation
* Tenant switching

## End-to-End Tests

Use Playwright for:

* Login
* Create customer
* Create sales order
* Approval
* Delivery
* Invoice posting
* Payment
* Purchase order
* Goods receipt
* Tenant isolation

---

# 76. Accessibility Testing

Include:

* Keyboard testing
* Screen-reader checks
* Color contrast
* Focus order
* Form labels
* Dialog focus trap
* Error announcement

Automated accessibility testing should be included in component and end-to-end tests.

---

# 77. Performance Strategy

Frontend performance controls:

* Route-based code splitting
* Lazy-load modules
* Server-side pagination
* Virtualize very large lists where needed
* Cache reference data
* Debounce search
* Cancel stale requests
* Avoid unnecessary rerenders
* Optimize bundle size
* Compress assets

---

# 78. Module Loading

Modules should load when accessed.

Example:

```text id="bml1zf"
User opens Finance
→ Load Finance route bundle
```

Users without Finance access should not download all Finance frontend code where practical.

---

# 79. Frontend Observability

Track:

* Page load time
* API failures
* JavaScript errors
* Slow interactions
* Failed form submissions
* Route errors
* Session expiry
* Correlation IDs

Error tracking must avoid collecting sensitive business data.

---

# 80. Frontend Security Rules

The frontend must not:

* Store secrets
* Trust hidden buttons as authorization
* Calculate final accounting entries independently
* Accept client-controlled tenant authority
* Expose restricted fields in browser state
* Log sensitive records
* Store refresh tokens insecurely
* Render unsanitized HTML

---

# 81. UX Acceptance Scenario: Sales Order

A sales representative should be able to:

1. Open Sales workspace.
2. Select Create Sales Order.
3. Search customer.
4. See credit warning.
5. Add products.
6. See availability.
7. Save draft.
8. Submit.
9. View approval status.
10. Confirm after approval.
11. View reservation status.
12. Navigate to delivery.
13. View invoice and payment relationship.

The user should not need to manually re-enter customer or product details in each stage.

---

# 82. UX Acceptance Scenario: Goods Receipt

A storekeeper should be able to:

1. Open expected receipts.
2. Select purchase order.
3. Scan product.
4. Enter received quantity.
5. Capture lot and expiry.
6. Mark rejected quantity.
7. Complete inspection.
8. Confirm location.
9. Post receipt.
10. See updated stock.

The interface should prevent receiving the wrong product without an override process.

---

# 83. UX Acceptance Scenario: Finance Posting

An accountant should be able to:

1. Open approved invoice.
2. Review source documents.
3. Review taxes.
4. Review journal preview.
5. Confirm posting date.
6. Post invoice.
7. Receive confirmation.
8. Open generated journal.
9. View receivable balance.

If configuration is missing, the error should explain the missing account or rule.

---

# 84. UX Acceptance Scenario: Approval

An approver should be able to:

1. Open approval inbox.
2. View document summary.
3. See amount and currency.
4. Review budget or credit impact.
5. Review attachments.
6. Review previous approvals.
7. Approve, reject or return.
8. Add comment.
9. Complete MFA if required.
10. See updated status.

---

# 85. Frontend Definition of Done

The frontend architecture phase is complete when:

* Technology stack is approved.
* Application shell is defined.
* Tenant and company switching is defined.
* Navigation model is approved.
* Role workspaces are identified.
* Dashboard standards are defined.
* List and table patterns are defined.
* Form architecture is approved.
* Approval inbox is defined.
* Notification center is defined.
* Finance and inventory experiences are defined.
* Responsive strategy is accepted.
* Accessibility requirements are accepted.
* Internationalization is defined.
* State-management responsibilities are clear.
* Permission-aware UI is defined.
* Error, loading and empty states are defined.
* Frontend folder structure is approved.
* Design-system foundations are defined.
* Testing strategy is documented.

---

# 86. Frontend Decision Summary

```text id="nsu13w"
Framework:
React and TypeScript

Build:
Vite

Styling:
Tailwind CSS and shadcn/ui

Server State:
TanStack Query

Client State:
Zustand

Forms:
React Hook Form and Zod

Tables:
TanStack Table

Navigation:
Role- and permission-aware modular navigation

Design:
Task-oriented, traceable and progressively disclosed

Security:
Backend-authoritative permissions and field filtering

Performance:
Lazy modules, pagination and controlled caching

Accessibility:
Keyboard and WCAG-oriented component standards

Internationalization:
Translation keys and locale-aware formatting
```

---

# 87. Next Documentation Stage

## Part 9: Infrastructure, Deployment, DevOps and Observability

The next document will define:

1. Environment strategy
2. Local development setup
3. Docker architecture
4. CI/CD pipelines
5. Cloud deployment
6. Application processes
7. PostgreSQL deployment
8. Redis deployment
9. Object storage
10. Background workers
11. Reverse proxy and load balancing
12. DNS and TLS
13. Secret management
14. Database migration deployment
15. Backup and disaster recovery
16. Logging
17. Metrics
18. Distributed tracing
19. Health checks
20. Alerting
21. Security scanning
22. Release strategy
23. Rollback strategy
24. Scaling strategy
25. Infrastructure acceptance tests
