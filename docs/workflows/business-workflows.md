# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 5: Detailed Module Workflows, State Machines and Accounting Impact

**Document Status:** Initial Workflow Design Draft
**Depends On:**

* Part 1 — Product Vision and Business Scope
* Part 2 — Detailed Business Requirements
* Part 3 — System Architecture and Domain Design
* Part 4 — Database Domain Model and ERD Design

**Architecture:** Multi-Tenant Modular Monolith
**Primary Database:** PostgreSQL
**Core Design:** Event-Driven Internal Integration
**Financial Model:** Double-Entry Accounting
**Inventory Model:** Movement and Valuation Ledger

---

# 1. Purpose of This Document

This document defines how the major ERP business processes behave from beginning to end.

It establishes:

* Business workflow steps
* Document state machines
* User actions
* Approval requirements
* Validation rules
* Inventory effects
* Accounting effects
* Domain events
* Exception handling
* Cancellation behaviour
* Reversal behaviour
* Cross-module responsibilities
* End-to-end acceptance scenarios

The objective is to ensure that each module operates as part of one controlled business platform rather than as an isolated CRUD application.

---

# 2. Core Workflow Principles

## 2.1 Business Actions Must Be Explicit

Important status changes must happen through business commands.

Correct:

```text
Submit Sales Order
Approve Purchase Order
Confirm Sales Order
Post Customer Invoice
Reverse Payment
Cancel Delivery
```

Incorrect:

```text
Update status field to "POSTED"
```

Every command must execute the relevant:

* Authorization checks
* Workflow checks
* Business validations
* Database transaction
* Audit logging
* Domain events
* Downstream impact

---

## 2.2 Draft and Posted Records Are Different

Draft documents are editable working documents.

Posted documents are business facts.

```text
Draft
→ Reviewed
→ Approved
→ Posted
```

After posting:

* Financial effect exists
* Inventory effect may exist
* Audit history is permanent
* Direct editing is prohibited
* Corrections require controlled reversal

---

## 2.3 Status Must Represent Real Business State

A document must not be marked completed merely because a user selected a status.

Examples:

* A sales order becomes `DELIVERED` only when all required delivery quantities are posted.
* An invoice becomes `PAID` only when allocations fully cover its balance.
* A purchase order becomes `RECEIVED` only when all required quantities are received or formally closed.
* A stock transfer becomes `COMPLETED` only when stock reaches the destination.

---

## 2.4 Cross-Module Reactions Use Domain Events

Modules may react to completed business events.

Example:

```text
SalesOrderConfirmed
        ↓
Inventory creates reservation
        ↓
Workflow closes approval instance
        ↓
Notifications inform warehouse
        ↓
Reporting updates order projections
```

The event represents a completed fact.

---

## 2.5 Accounting Effects Are Posted Through Finance

Operational modules do not directly manipulate ledger balances.

They request financial posting through defined application contracts or internal events.

Example:

```text
Warehouse posts delivery
        ↓
Inventory calculates product cost
        ↓
Finance posts:
Debit Cost of Goods Sold
Credit Inventory
```

---

# 3. Standard Document Actions

Most business documents may support the following actions.

| Action     | Meaning                                               |
| ---------- | ----------------------------------------------------- |
| Save Draft | Store editable document                               |
| Submit     | Send for validation or approval                       |
| Approve    | Authorize the document                                |
| Reject     | End approval unsuccessfully                           |
| Return     | Send document back for correction                     |
| Confirm    | Create an operational commitment                      |
| Post       | Record final inventory or accounting impact           |
| Close      | End remaining open quantities or obligations          |
| Cancel     | Stop an uncompleted document                          |
| Reverse    | Create an opposite transaction                        |
| Reopen     | Return an eligible closed document to an active state |
| Archive    | Hide inactive master data without deleting history    |

Not every document supports every action.

---

# 4. Standard State Categories

ERP states should be grouped into four categories.

## 4.1 Preparation States

```text
DRAFT
SUBMITTED
PENDING_APPROVAL
RETURNED
```

## 4.2 Authorized States

```text
APPROVED
CONFIRMED
```

## 4.3 Execution States

```text
PARTIALLY_RESERVED
RESERVED
PARTIALLY_RECEIVED
PARTIALLY_DELIVERED
PARTIALLY_INVOICED
PARTIALLY_PAID
PROCESSING
```

## 4.4 Terminal States

```text
COMPLETED
CLOSED
CANCELLED
REJECTED
EXPIRED
POSTED
REVERSED
```

---

# 5. Lead-to-Cash Process Overview

Lead-to-Cash manages the complete customer revenue lifecycle.

```text
Lead
→ Qualification
→ Opportunity
→ Customer
→ Quotation
→ Sales Order
→ Stock Reservation
→ Warehouse Fulfilment
→ Delivery
→ Customer Invoice
→ Payment
→ Reconciliation
→ Financial Reporting
```

Main modules involved:

* CRM
* Customer Management
* Pricing
* Sales
* Workflow
* Inventory
* Warehouse
* Finance
* Payments
* Notifications
* Audit
* Reporting

---

# 6. Lead Workflow

## 6.1 Lead States

```text
NEW
→ ASSIGNED
→ CONTACTED
→ QUALIFIED
→ CONVERTED
```

Alternative states:

```text
UNQUALIFIED
LOST
DUPLICATE
CANCELLED
```

## 6.2 Lead Creation

A lead may be created from:

* Manual entry
* Public web form
* Marketing campaign
* Email
* API integration
* Data import
* Referral
* Existing customer recommendation

Required fields:

* Lead name or company
* Contact method
* Lead source
* Assigned salesperson or queue
* Tenant and company context

## 6.3 Lead Qualification Rules

A lead may be marked qualified when sufficient information exists regarding:

* Customer need
* Product interest
* Budget
* Decision authority
* Expected timeline
* Geographic eligibility
* Business suitability

## 6.4 Lead Conversion

A qualified lead may create:

* Party
* Customer prospect
* Contact
* Opportunity

Conversion must prevent duplicate creation where an existing customer or party already matches.

## 6.5 Lead Events

```text
LeadCreated
LeadAssigned
LeadContacted
LeadQualified
LeadUnqualified
LeadConverted
LeadLost
```

## 6.6 Accounting and Inventory Impact

Lead activities have:

```text
Accounting Impact: None
Inventory Impact: None
```

---

# 7. Opportunity Workflow

## 7.1 Opportunity States

```text
QUALIFICATION
→ NEEDS_ANALYSIS
→ PROPOSAL
→ NEGOTIATION
→ WON
```

Alternative terminal states:

```text
LOST
CANCELLED
ON_HOLD
```

## 7.2 Opportunity Data

* Customer or lead
* Estimated value
* Currency
* Expected closing date
* Products or services
* Probability
* Assigned salesperson
* Sales stage
* Competitors
* Notes
* Activities

## 7.3 Opportunity Won

A won opportunity may:

* Create a customer if not already created
* Create a quotation
* Record expected sales value
* Close outstanding sales activities

## 7.4 Opportunity Lost

A lost opportunity must include:

* Lost reason
* Competitor where applicable
* User comments
* Loss date

## 7.5 Events

```text
OpportunityCreated
OpportunityStageChanged
OpportunityWon
OpportunityLost
```

## 7.6 Accounting and Inventory Impact

```text
Accounting Impact: None
Inventory Impact: None
```

Forecast amounts are not posted accounting revenue.

---

# 8. Customer Creation and Approval Workflow

## 8.1 Customer States

```text
PROSPECT
→ PENDING_APPROVAL
→ ACTIVE
```

Alternative states:

```text
ON_HOLD
CREDIT_BLOCKED
INACTIVE
BLACKLISTED
REJECTED
```

## 8.2 Customer Approval Checks

The system may validate:

* Duplicate customer
* Tax number
* Registration number
* Phone number
* Email
* Credit terms
* Credit limit
* Customer group
* Required documents
* Assigned salesperson
* Billing and shipping addresses

## 8.3 Credit Profile

Before credit sales are allowed, Finance may approve:

* Credit limit
* Credit days
* Risk rating
* Temporary credit limit
* Credit expiry date

## 8.4 Customer Events

```text
CustomerCreated
CustomerSubmittedForApproval
CustomerApproved
CustomerRejected
CustomerCreditUpdated
CustomerCreditBlocked
CustomerReactivated
```

## 8.5 Accounting Impact

Creating a customer does not create accounting entries.

Customer balances exist only after posted financial transactions.

---

# 9. Sales Quotation Workflow

## 9.1 Quotation State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ SENT
→ ACCEPTED
→ CONVERTED
```

Alternative states:

```text
RETURNED
REJECTED
EXPIRED
CANCELLED
```

## 9.2 Draft Quotation

Users may edit:

* Customer
* Products
* Quantities
* Unit prices
* Discounts
* Taxes
* Delivery terms
* Payment terms
* Expiry date
* Notes

## 9.3 Quotation Calculation

For each line:

```text
Gross Line Amount =
Quantity × Unit Price
```

```text
Net Line Amount =
Gross Line Amount - Line Discount
```

```text
Line Total =
Net Line Amount + Tax + Charges
```

Document total:

```text
Grand Total =
Subtotal
- Discount Total
+ Tax Total
+ Charge Total
```

## 9.4 Approval Conditions

Approval may be required when:

* Discount exceeds user limit
* Price is below minimum margin
* Customer is credit blocked
* Payment term exceeds policy
* Quotation value exceeds authority
* Product is restricted
* Delivery date is exceptional

## 9.5 Quotation Acceptance

Acceptance may be recorded through:

* Customer signature
* Email confirmation
* Uploaded purchase order
* Salesperson confirmation with authority
* Digital acceptance

## 9.6 Expiration

An expired quotation cannot automatically become a sales order.

Possible actions:

* Extend expiry date
* Create revision
* Reprice
* Reapprove
* Create new quotation

## 9.7 Events

```text
QuotationCreated
QuotationSubmitted
QuotationApproved
QuotationSent
QuotationAccepted
QuotationRejected
QuotationExpired
QuotationConverted
```

## 9.8 Accounting and Inventory Impact

```text
Accounting Impact: None
Inventory Impact: None
```

A quotation is not a financial or inventory commitment.

---

# 10. Sales Order Workflow

## 10.1 Sales Order State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ CONFIRMED
→ RESERVATION_PENDING
→ PARTIALLY_RESERVED
→ RESERVED
→ PARTIALLY_DELIVERED
→ DELIVERED
→ PARTIALLY_INVOICED
→ INVOICED
→ CLOSED
```

Alternative states:

```text
RETURNED
REJECTED
ON_HOLD
CANCELLED
```

A sales order may have simultaneous fulfilment and invoicing progress values instead of relying on one overloaded status field.

Recommended progress fields:

```text
approval_status
reservation_status
delivery_status
invoice_status
payment_status
overall_status
```

## 10.2 Sales Order Creation Sources

A sales order may be created from:

* Accepted quotation
* Customer contract
* Direct authorized order
* E-commerce order
* Point-of-sale order
* Recurring order
* External API

## 10.3 Confirmation Validations

Before confirmation, validate:

* Customer is active
* Customer is not blacklisted
* Credit policy is satisfied
* Product is active
* Quantity is valid
* Price is valid
* Discount is approved
* Tax configuration exists
* Warehouse exists
* Delivery address exists
* Required date is valid
* Currency and exchange rate exist
* Required workflow is approved

## 10.4 Credit Exposure Calculation

A configurable credit exposure formula may include:

```text
Outstanding Invoices
+ Open Sales Orders
+ Undelivered Credit Commitments
+ Unallocated Charges
- Customer Advances
= Credit Exposure
```

Credit decision:

```text
Credit Exposure + New Order Value
≤ Approved Credit Limit
```

If exceeded:

* Block confirmation
* Request override
* Require advance payment
* Reduce order
* Place order on hold

## 10.5 Reservation Request

After confirmation:

```text
SalesOrderConfirmed
        ↓
Inventory reservation requested
```

Reservation result:

```text
FULLY_RESERVED
PARTIALLY_RESERVED
FAILED
BACKORDERED
```

## 10.6 Sales Order Events

```text
SalesOrderCreated
SalesOrderSubmitted
SalesOrderApproved
SalesOrderConfirmed
StockReservationRequested
SalesOrderPartiallyReserved
SalesOrderReserved
SalesOrderPlacedOnHold
SalesOrderCancelled
SalesOrderClosed
```

## 10.7 Accounting Impact

Sales order confirmation usually creates no journal entry.

However, it may create:

* Budget commitment
* Credit exposure
* Management commitment reporting

These are not posted general-ledger revenue.

## 10.8 Inventory Impact

Sales order confirmation may create stock reservations.

It does not reduce quantity on hand.

```text
Quantity On Hand: unchanged
Reserved Quantity: increases
Available Quantity: decreases
```

---

# 11. Stock Reservation Workflow

## 11.1 Reservation States

```text
REQUESTED
→ ACTIVE
→ PARTIALLY_FULFILLED
→ FULFILLED
```

Alternative states:

```text
FAILED
RELEASED
EXPIRED
CANCELLED
```

## 11.2 Reservation Calculation

```text
Available Quantity =
On Hand
- Existing Reservations
- Quarantine
- Damaged
- Blocked
```

## 11.3 Reservation Policies

Possible policies:

* First available stock
* Specific warehouse
* Specific location
* FIFO
* FEFO
* Specific lot
* Specific serial
* Preferred branch
* Nearest warehouse

## 11.4 Concurrent Reservation Control

Reservation must use safe concurrency controls such as:

* Row-level database locks
* Atomic conditional update
* Optimistic versioning
* Reservation transaction

Example condition:

```text
Reserve only when:
quantity_available >= requested_quantity
```

## 11.5 Partial Reservation

If only part of the stock exists:

```text
Requested: 100
Available: 60
Reserved: 60
Backordered: 40
```

Policy options:

* Allow partial reservation
* Require complete reservation
* Reserve available quantity and create backorder
* Source remaining quantity from another warehouse

## 11.6 Reservation Release

Reservations may be released when:

* Sales order is cancelled
* Order expires
* Customer fails payment condition
* Warehouse cannot fulfil
* Manager manually releases stock
* Reservation timeout expires

## 11.7 Events

```text
StockReservationRequested
StockReserved
StockPartiallyReserved
StockReservationFailed
StockReservationReleased
StockReservationExpired
```

## 11.8 Accounting Impact

```text
Accounting Impact: None
```

Reservations are operational commitments, not accounting transactions.

---

# 12. Warehouse Sales Fulfilment Workflow

## 12.1 Fulfilment Process

```text
Sales Order Reserved
→ Create Pick Task
→ Pick Products
→ Validate Quantities
→ Pack Products
→ Create Delivery
→ Ship
→ Confirm Delivery
→ Post Stock Movement
```

## 12.2 Warehouse Task States

```text
CREATED
→ ASSIGNED
→ IN_PROGRESS
→ COMPLETED
```

Alternative states:

```text
ON_HOLD
CANCELLED
FAILED
```

## 12.3 Picking Validations

The warehouse must validate:

* Product
* Quantity
* Warehouse
* Location
* Lot
* Serial number
* Expiry date
* Reservation
* Product condition

## 12.4 Short Pick

A short pick occurs when less stock is physically found than reserved.

Possible actions:

* Update picked quantity
* Request recount
* Select alternative location
* Select alternative lot
* Create partial delivery
* Create inventory discrepancy
* Release missing reservation

## 12.5 Packing

Packing records:

* Package number
* Product quantities
* Weight
* Dimensions
* Packed by
* Packing date
* Shipping marks

## 12.6 Shipping

Shipping records:

* Carrier
* Driver
* Vehicle
* Route
* Tracking number
* Dispatch date
* Expected delivery date

---

# 13. Delivery Note Workflow

## 13.1 Delivery State Machine

```text
DRAFT
→ READY_TO_PICK
→ PICKING
→ PICKED
→ PACKED
→ READY_TO_SHIP
→ SHIPPED
→ DELIVERED
→ POSTED
```

Alternative states:

```text
PARTIALLY_DELIVERED
FAILED_DELIVERY
RETURNED
CANCELLED
```

## 13.2 Posting Delivery

Posting delivery must:

1. Validate the sales order
2. Validate reservation
3. Validate picked quantities
4. Validate lot and serial tracking
5. Validate stock availability
6. Create stock movement
7. Reduce stock on hand
8. Fulfil reservation
9. Update sales order delivered quantities
10. Calculate inventory cost
11. Create accounting posting request
12. Add outbox event
13. Commit transaction

## 13.3 Inventory Impact

```text
Quantity On Hand: decreases
Reserved Quantity: decreases
Available Quantity: normally unchanged for reserved stock
Outgoing Quantity: decreases
```

## 13.4 Accounting Impact

For perpetual inventory:

```text
Debit: Cost of Goods Sold
Credit: Inventory
```

Example:

```text
Product cost delivered: $700

Debit  Cost of Goods Sold      $700
Credit Inventory               $700
```

This entry must use the inventory valuation determined by:

* FIFO
* Weighted average
* Standard cost
* Specific identification

## 13.5 Revenue Recognition

Delivery itself does not always create revenue.

Revenue timing depends on accounting configuration:

* Invoice-based recognition
* Delivery-based recognition
* Contract-based recognition
* Project milestone recognition

For the MVP:

> Revenue is recognized when the customer invoice is posted.

## 13.6 Delivery Events

```text
PickingStarted
PickingCompleted
DeliveryPacked
DeliveryShipped
DeliveryPosted
DeliveryFailed
DeliveryCancelled
```

---

# 14. Customer Invoice Workflow

## 14.1 Invoice State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ POSTED
→ PARTIALLY_PAID
→ PAID
```

Additional states:

```text
OVERDUE
ON_HOLD
CREDITED
CANCELLED
REVERSED
```

## 14.2 Invoice Creation Sources

Customer invoice may be created from:

* Delivery note
* Sales order
* Service completion
* Project milestone
* Contract schedule
* Manual authorized billing

## 14.3 Invoice Validations

Before posting:

* Customer is valid
* Invoice number exists
* Posting period is open
* Currency exists
* Exchange rate exists
* Quantities are valid
* Prices are valid
* Taxes are calculated
* Revenue accounts are configured
* Accounts receivable account exists
* Invoice is balanced
* Source quantities are not over-invoiced
* Required approval is complete

## 14.4 Invoice Posting

One database transaction should:

1. Lock invoice for posting
2. Confirm invoice is not already posted
3. Recalculate totals
4. Validate fiscal period
5. Create journal entry
6. Create journal lines
7. Create receivable subledger entry
8. Set outstanding amount
9. Set invoice status to `POSTED`
10. Create outbox event
11. Commit

## 14.5 Accounting Entry

Example invoice:

```text
Subtotal: $1,000
Tax:       $150
Total:    $1,150
```

Posting:

```text
Debit  Accounts Receivable    $1,150
Credit Sales Revenue          $1,000
Credit Tax Payable              $150
```

## 14.6 Foreign Currency Invoice

The system stores:

* Transaction currency
* Transaction amount
* Base currency
* Base amount
* Exchange rate used

Example:

```text
Invoice: EUR 1,000
Rate: 1 EUR = 1.10 USD
Base value: USD 1,100
```

## 14.7 Due Date Calculation

Due date may be based on:

* Invoice date
* Posting date
* End of month
* Fixed day
* Payment-term schedule

## 14.8 Invoice Events

```text
CustomerInvoiceCreated
CustomerInvoiceApproved
CustomerInvoicePosted
CustomerInvoicePartiallyPaid
CustomerInvoicePaid
CustomerInvoiceOverdue
CustomerInvoiceCredited
CustomerInvoiceReversed
```

## 14.9 Inventory Impact

Normally:

```text
Inventory Impact: None
```

Inventory was already reduced by delivery.

For invoice-before-delivery businesses, no stock impact occurs until delivery.

---

# 15. Customer Payment Workflow

## 15.1 Payment States

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ POSTED
→ PARTIALLY_ALLOCATED
→ FULLY_ALLOCATED
```

Alternative states:

```text
FAILED
REVERSED
CANCELLED
```

## 15.2 Payment Sources

* Cash
* Bank transfer
* Cheque
* Card
* Mobile money
* Customer advance
* Internal clearing
* Refund offset

## 15.3 Payment Validation

* Customer exists
* Amount is positive
* Currency exists
* Payment account is active
* External transaction reference is unique where required
* Posting period is open
* Approval is complete
* Allocations do not exceed available amount
* Allocation does not exceed invoice outstanding balance

## 15.4 Payment Posting

Posting transaction:

1. Validate payment
2. Check idempotency
3. Create or lock payment
4. Create allocations
5. Create journal entry
6. Update customer invoice balances
7. Update payment allocation status
8. Create outbox event
9. Commit

## 15.5 Accounting Entry

Customer payment:

```text
Debit  Cash or Bank
Credit Accounts Receivable
```

Example:

```text
Debit  Bank                    $1,150
Credit Accounts Receivable    $1,150
```

## 15.6 Partial Payment

Invoice:

```text
Outstanding: $1,150
Payment:       $500
```

Result:

```text
Invoice status: PARTIALLY_PAID
Remaining balance: $650
```

## 15.7 Customer Advance

Payment received before invoice:

```text
Debit  Bank
Credit Customer Advances
```

When allocated later:

```text
Debit  Customer Advances
Credit Accounts Receivable
```

## 15.8 Events

```text
CustomerPaymentCreated
CustomerPaymentPosted
CustomerPaymentAllocated
CustomerPaymentPartiallyAllocated
CustomerPaymentFullyAllocated
CustomerPaymentReversed
```

---

# 16. Customer Credit Note Workflow

## 16.1 Credit Note State Machine

```text
DRAFT
→ PENDING_APPROVAL
→ APPROVED
→ POSTED
→ ALLOCATED
```

Alternative states:

```text
CANCELLED
REVERSED
```

## 16.2 Reasons

* Customer return
* Pricing correction
* Discount adjustment
* Tax correction
* Damaged delivery
* Billing error
* Service failure

## 16.3 Posting Entry

Example credit note:

```text
Debit  Sales Returns or Revenue Adjustment
Debit  Tax Payable
Credit Accounts Receivable
```

If the original invoice has already been paid, the credit may become:

* Customer credit balance
* Refund payable
* Offset against future invoices

## 16.4 Restrictions

A credit note should reference the original invoice where possible.

Credited quantity and amount must not exceed permitted values without authorization.

---

# 17. Customer Return Workflow

## 17.1 Return Process

```text
Return Request
→ Return Authorization
→ Receive Returned Goods
→ Inspect Goods
→ Decide Resolution
→ Post Inventory Return
→ Create Credit Note or Replacement
→ Close Return
```

## 17.2 Return States

```text
REQUESTED
→ PENDING_APPROVAL
→ AUTHORIZED
→ RECEIVED
→ INSPECTED
→ RESOLUTION_PENDING
→ COMPLETED
```

Alternative states:

```text
REJECTED
CANCELLED
```

## 17.3 Return Inspection Results

```text
SELLABLE
DAMAGED
QUARANTINE
REPAIRABLE
SCRAP
NOT_OUR_PRODUCT
```

## 17.4 Inventory Impact

Sellable return:

```text
Quantity On Hand: increases
Inventory Value: increases
```

Damaged return:

```text
Damaged Quantity: increases
Available Quantity: unchanged
```

Quarantine return:

```text
Quarantine Quantity: increases
Available Quantity: unchanged
```

## 17.5 Accounting Impact

Return of previously delivered goods:

```text
Debit  Inventory
Credit Cost of Goods Sold
```

Customer credit note:

```text
Debit  Sales Returns
Debit  Tax Payable
Credit Accounts Receivable
```

## 17.6 Events

```text
CustomerReturnRequested
CustomerReturnAuthorized
CustomerReturnReceived
CustomerReturnInspected
CustomerReturnPosted
CustomerCreditNoteRequested
ReplacementOrderRequested
```

---

# 18. Procure-to-Pay Process Overview

```text
Purchase Request
→ Approval
→ Request for Quotation
→ Supplier Quotation
→ Quotation Comparison
→ Purchase Order
→ Approval
→ Goods Receipt
→ Quality Inspection
→ Inventory Posting
→ Supplier Invoice
→ Three-Way Matching
→ Supplier Payment
→ Financial Reconciliation
```

Modules involved:

* Procurement
* Supplier Management
* Workflow
* Inventory
* Warehouse
* Finance
* Payments
* Documents
* Notifications
* Reporting
* Audit

---

# 19. Supplier Creation and Approval Workflow

## 19.1 Supplier States

```text
DRAFT
→ PENDING_APPROVAL
→ APPROVED
→ ACTIVE
```

Alternative states:

```text
RETURNED
REJECTED
ON_HOLD
SUSPENDED
BLACKLISTED
INACTIVE
```

## 19.2 Supplier Validation

* Duplicate supplier check
* Registration number
* Tax number
* Contact details
* Supplier category
* Payment terms
* Currency
* Required documents
* Bank details
* Procurement categories

## 19.3 Bank Detail Approval

Supplier bank changes should require:

* Change request
* Reason
* Independent verification
* Additional approval
* Audit event
* Notification to Finance

## 19.4 Events

```text
SupplierCreated
SupplierSubmittedForApproval
SupplierApproved
SupplierRejected
SupplierBankDetailsChanged
SupplierSuspended
```

## 19.5 Accounting Impact

Supplier creation has no accounting impact.

---

# 20. Purchase Request Workflow

## 20.1 State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ PARTIALLY_ORDERED
→ FULLY_ORDERED
→ CLOSED
```

Alternative states:

```text
RETURNED
REJECTED
CANCELLED
```

## 20.2 Purchase Request Validations

* Requester is authorized
* Department is valid
* Cost center is valid
* Product or description exists
* Quantity is positive
* Required date is valid
* Business justification exists
* Budget is available where required
* Preferred supplier is approved where provided

## 20.3 Budget Control

Possible budget outcomes:

```text
WITHIN_BUDGET
WARNING
OVER_BUDGET
BUDGET_NOT_FOUND
OVERRIDE_REQUIRED
```

## 20.4 Accounting Impact

Normally no general-ledger posting occurs.

Optional management commitment:

```text
Approved Purchase Request
→ Budget reservation
```

This is a budget control, not an expense.

## 20.5 Events

```text
PurchaseRequestCreated
PurchaseRequestSubmitted
PurchaseRequestApproved
PurchaseRequestRejected
PurchaseRequestBudgetReserved
PurchaseRequestClosed
```

---

# 21. Request for Quotation Workflow

## 21.1 RFQ States

```text
DRAFT
→ ISSUED
→ OPEN
→ RESPONSES_RECEIVED
→ EVALUATION
→ AWARDED
→ CLOSED
```

Alternative states:

```text
CANCELLED
EXPIRED
```

## 21.2 Supplier Invitation

The RFQ may be sent to multiple approved suppliers.

Each invitation tracks:

* Sent date
* Response deadline
* Response status
* Supplier contact
* Confidentiality status

## 21.3 Quotation Comparison

Comparison criteria:

* Unit price
* Total price
* Taxes
* Additional costs
* Delivery time
* Payment terms
* Warranty
* Supplier score
* Quality
* Historical delivery performance
* Landed cost

## 21.4 Award

The award may:

* Select one supplier
* Split quantities among suppliers
* Reject all quotations
* Request new quotations

## 21.5 Accounting and Inventory Impact

```text
Accounting Impact: None
Inventory Impact: None
```

---

# 22. Purchase Order Workflow

## 22.1 State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ SENT
→ ACKNOWLEDGED
→ PARTIALLY_RECEIVED
→ RECEIVED
→ PARTIALLY_INVOICED
→ INVOICED
→ CLOSED
```

Alternative states:

```text
RETURNED
REJECTED
ON_HOLD
CANCELLED
```

## 22.2 Confirmation Validations

* Supplier is approved
* Products are valid
* Quantities are positive
* Prices are approved
* Budget is available
* Currency and exchange rate exist
* Warehouse exists
* Required date exists
* Payment terms exist
* Approval is complete

## 22.3 Purchase Order Commitment

An approved purchase order may create:

* Procurement commitment
* Budget consumption or encumbrance
* Expected incoming stock
* Expected cash requirement

## 22.4 Purchase Order Amendment

Changes after approval may require a new version when changing:

* Quantity
* Price
* Supplier
* Currency
* Delivery date
* Warehouse
* Payment terms

The amendment must:

1. Record original version
2. Record change reason
3. Recalculate totals
4. Recheck budget
5. Re-enter approval where required

## 22.5 Cancellation Rules

A purchase order cannot be freely cancelled when:

* Goods have been received
* Supplier invoice exists
* Supplier advance exists
* Goods are in transit
* Contract obligation remains

Possible actions:

* Cancel remaining quantity only
* Close order
* Create supplier return
* Reverse receipt
* Cancel related invoice where valid

## 22.6 Events

```text
PurchaseOrderCreated
PurchaseOrderSubmitted
PurchaseOrderApproved
PurchaseOrderSent
PurchaseOrderAcknowledged
PurchaseOrderAmended
PurchaseOrderCancelled
PurchaseOrderClosed
```

## 22.7 Accounting Impact

Normally approval creates no general-ledger posting.

Optional encumbrance accounting may be added later.

## 22.8 Inventory Impact

```text
Incoming Quantity: increases
Quantity On Hand: unchanged
Available Quantity: unchanged
```

---

# 23. Goods Receipt Workflow

## 23.1 Receipt Process

```text
Purchase Order
→ Arrival
→ Receiving
→ Quantity Verification
→ Quality Inspection
→ Accept or Reject
→ Put-Away
→ Post Goods Receipt
```

## 23.2 Goods Receipt States

```text
DRAFT
→ RECEIVING
→ INSPECTION_PENDING
→ PARTIALLY_ACCEPTED
→ ACCEPTED
→ POSTED
```

Alternative states:

```text
REJECTED
ON_HOLD
CANCELLED
REVERSED
```

## 23.3 Receipt Validations

* Purchase order is valid
* Supplier matches
* Warehouse matches
* Product matches
* Received quantity is valid
* Over-receipt tolerance is respected
* Lot exists where required
* Serial numbers are unique
* Expiry is valid
* Unit of measure conversion is valid

## 23.4 Quantity Classification

```text
Received Quantity =
Accepted Quantity
+ Rejected Quantity
+ Quarantine Quantity
```

## 23.5 Partial Receipt

Purchase order:

```text
Ordered: 100
Received now: 60
Remaining: 40
```

Result:

```text
Purchase Order status: PARTIALLY_RECEIVED
Incoming Quantity: reduced by 60
On Hand Quantity: increased by 60
```

## 23.6 Goods Receipt Posting Transaction

1. Validate purchase order
2. Lock purchase-order lines
3. Validate quantities
4. Validate tracking data
5. Create stock movement
6. Create valuation layer
7. Update stock balance
8. Update purchase-order received quantity
9. Create accounting posting
10. Add outbox event
11. Commit

## 23.7 Accounting Impact

For perpetual inventory with goods-received-not-invoiced:

```text
Debit  Inventory
Credit Goods Received Not Invoiced
```

Example:

```text
Received inventory value: $5,000

Debit  Inventory                     $5,000
Credit Goods Received Not Invoiced   $5,000
```

For rejected stock:

* No available stock increase
* Possible quarantine tracking
* No final inventory recognition until accepted, depending on policy

## 23.8 Inventory Impact

Accepted goods:

```text
On Hand: increases
Incoming: decreases
Available: increases
Inventory Value: increases
```

Quarantine goods:

```text
On Hand: may increase
Quarantine: increases
Available: unchanged
```

## 23.9 Events

```text
GoodsReceiptCreated
GoodsReceived
GoodsPartiallyAccepted
GoodsRejected
GoodsReceiptPosted
InventoryReceived
PurchaseOrderPartiallyReceived
PurchaseOrderReceived
```

---

# 24. Put-Away Workflow

## 24.1 Process

```text
Receiving Area
→ Put-Away Recommendation
→ Warehouse Task
→ Move Goods
→ Confirm Destination
→ Complete Task
```

## 24.2 Put-Away Rules

Recommendations may consider:

* Product category
* Temperature
* Hazard class
* Capacity
* Lot
* Expiry
* Fast-moving classification
* Dedicated location
* Security level

## 24.3 Inventory Impact

A put-away movement changes location, not total company stock.

```text
Receiving Location: decreases
Storage Location: increases
Total Warehouse Stock: unchanged
```

## 24.4 Accounting Impact

```text
Accounting Impact: None
```

---

# 25. Supplier Invoice Workflow

## 25.1 State Machine

```text
DRAFT
→ SUBMITTED
→ MATCHING
→ MATCHED
→ PENDING_APPROVAL
→ APPROVED
→ POSTED
→ PARTIALLY_PAID
→ PAID
```

Alternative states:

```text
EXCEPTION
BLOCKED
RETURNED
REJECTED
CANCELLED
REVERSED
```

## 25.2 Invoice Sources

* Purchase order
* Goods receipt
* Service purchase
* Expense
* Asset acquisition
* Contract billing
* Utility bill
* Manual authorized invoice

## 25.3 Duplicate Invoice Validation

Duplicate detection may use:

```text
Supplier
+ Supplier Invoice Number
+ Invoice Date
+ Amount
```

At minimum:

```text
UNIQUE (tenant_id, supplier_id, supplier_invoice_number)
```

where business rules permit.

## 25.4 Three-Way Matching

Compare:

```text
Purchase Order
Goods Receipt
Supplier Invoice
```

For each invoice line:

```text
Ordered Quantity
Received Quantity
Invoiced Quantity
Ordered Price
Invoiced Price
Tax
Additional Charges
```

## 25.5 Match Outcomes

```text
MATCHED
WITHIN_TOLERANCE
QUANTITY_EXCEPTION
PRICE_EXCEPTION
TAX_EXCEPTION
MISSING_RECEIPT
MISSING_ORDER
BLOCKED
APPROVED_EXCEPTION
```

## 25.6 Posting Supplier Invoice

With previous goods receipt:

```text
Debit  Goods Received Not Invoiced
Debit  Recoverable Tax
Debit/Credit Purchase Price Variance
Credit Accounts Payable
```

Example:

```text
GRNI value:       $5,000
Supplier invoice: $5,100
Tax:                $150
Price variance:     $100
Total payable:    $5,250
```

Entry:

```text
Debit  Goods Received Not Invoiced   $5,000
Debit  Purchase Price Variance          $100
Debit  Recoverable Tax                  $150
Credit Accounts Payable               $5,250
```

For an expense invoice:

```text
Debit  Expense
Debit  Recoverable Tax
Credit Accounts Payable
```

## 25.7 Inventory Impact

Normally:

```text
Inventory Quantity Impact: None
```

The quantity was recorded at goods receipt.

The invoice may affect:

* Inventory cost
* Purchase price variance
* Landed cost
* Valuation adjustments

## 25.8 Events

```text
SupplierInvoiceCreated
SupplierInvoiceMatched
SupplierInvoiceExceptionDetected
SupplierInvoiceApproved
SupplierInvoicePosted
SupplierInvoicePartiallyPaid
SupplierInvoicePaid
SupplierInvoiceReversed
```

---

# 26. Supplier Payment Workflow

## 26.1 State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ SCHEDULED
→ POSTED
→ ALLOCATED
→ COMPLETED
```

Alternative states:

```text
FAILED
REJECTED
CANCELLED
REVERSED
```

## 26.2 Payment Controls

Validate:

* Supplier is active
* Supplier bank details are verified
* Invoice is approved
* Invoice is not blocked
* Payment amount is valid
* Cash or bank account is active
* Currency is valid
* Approval authority is satisfied
* Creator and approver comply with segregation of duties

## 26.3 Accounting Entry

```text
Debit  Accounts Payable
Credit Bank or Cash
```

Example:

```text
Debit  Accounts Payable   $5,250
Credit Bank               $5,250
```

## 26.4 Supplier Advance

Advance payment:

```text
Debit  Supplier Advances
Credit Bank
```

Later allocation:

```text
Debit  Accounts Payable
Credit Supplier Advances
```

## 26.5 Events

```text
SupplierPaymentCreated
SupplierPaymentApproved
SupplierPaymentPosted
SupplierPaymentAllocated
SupplierPaymentCompleted
SupplierPaymentFailed
SupplierPaymentReversed
```

---

# 27. Supplier Return Workflow

## 27.1 Process

```text
Identify Return
→ Create Return Request
→ Approve Return
→ Pick Goods
→ Ship to Supplier
→ Post Stock Reduction
→ Receive Debit Note or Supplier Credit
→ Close Return
```

## 27.2 Return States

```text
DRAFT
→ PENDING_APPROVAL
→ APPROVED
→ READY_TO_SHIP
→ SHIPPED
→ POSTED
→ CREDIT_PENDING
→ COMPLETED
```

Alternative states:

```text
REJECTED
CANCELLED
```

## 27.3 Inventory Impact

```text
Quantity On Hand: decreases
Available Quantity: decreases
Inventory Value: decreases
```

## 27.4 Accounting Impact

Return stock:

```text
Debit  Goods Received Not Invoiced or Supplier Receivable
Credit Inventory
```

Supplier debit note or credit:

```text
Debit  Accounts Payable
Credit Purchase Return or Relevant Clearing Account
Credit Recoverable Tax where applicable
```

Exact entry depends on whether the supplier invoice was already posted.

---

# 28. Stock Transfer Workflow

## 28.1 Transfer Types

* Warehouse to warehouse
* Location to location
* Branch to branch
* Company to company
* Warehouse to transit
* Transit to destination

## 28.2 State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ READY_TO_PICK
→ PICKED
→ DISPATCHED
→ IN_TRANSIT
→ RECEIVED
→ COMPLETED
```

Alternative states:

```text
PARTIALLY_RECEIVED
REJECTED
CANCELLED
REVERSED
```

## 28.3 Same-Warehouse Transfer

For movement between locations in the same warehouse:

```text
Source Location: decreases
Destination Location: increases
Total Warehouse Quantity: unchanged
```

## 28.4 Inter-Warehouse Transfer

At dispatch:

```text
Source Warehouse: decreases
In-Transit Warehouse: increases
```

At receipt:

```text
In-Transit Warehouse: decreases
Destination Warehouse: increases
```

## 28.5 Accounting Impact

Same company and same valuation:

```text
Accounting Impact: Usually none
```

If branch or warehouse accounts are separately represented:

```text
Debit  Destination Inventory
Credit Source Inventory
```

Inter-company transfer may require:

* Inter-company sale
* Inter-company purchase
* Transfer pricing
* Due-from and due-to accounts
* Separate tax treatment

This should be implemented in a later advanced release.

## 28.6 Events

```text
StockTransferRequested
StockTransferApproved
StockTransferDispatched
StockTransferReceived
StockTransferPartiallyReceived
StockTransferCompleted
```

---

# 29. Inventory Adjustment Workflow

## 29.1 Reasons

* Physical count variance
* Damage
* Expiry
* Theft
* Data correction
* Conversion difference
* Opening balance
* Quality rejection
* Found stock

## 29.2 State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ POSTED
```

Alternative states:

```text
RETURNED
REJECTED
CANCELLED
REVERSED
```

## 29.3 Adjustment Calculation

```text
Variance Quantity =
Counted Quantity - System Quantity
```

Positive variance:

```text
ADJUSTMENT_IN
```

Negative variance:

```text
ADJUSTMENT_OUT
```

## 29.4 Accounting Impact

Positive adjustment:

```text
Debit  Inventory
Credit Inventory Gain
```

Negative adjustment:

```text
Debit  Inventory Loss or Shrinkage Expense
Credit Inventory
```

Damage write-off:

```text
Debit  Damage Expense
Credit Inventory
```

Expiry write-off:

```text
Debit  Expired Inventory Expense
Credit Inventory
```

## 29.5 Controls

Adjustment may require:

* Reason code
* Supporting document
* Count evidence
* Approval level based on value
* Separation between counter and approver
* Audit record

## 29.6 Events

```text
InventoryAdjustmentCreated
InventoryAdjustmentApproved
InventoryAdjustmentPosted
InventoryGainRecorded
InventoryLossRecorded
InventoryAdjustmentReversed
```

---

# 30. Physical Inventory Count Workflow

## 30.1 Process

```text
Plan Count
→ Freeze or Control Movements
→ Generate Count Sheet
→ Count
→ Recount Variances
→ Approve Differences
→ Post Adjustments
→ Close Count
```

## 30.2 State Machine

```text
PLANNED
→ RELEASED
→ COUNTING
→ RECOUNT_REQUIRED
→ REVIEW
→ APPROVED
→ POSTED
→ CLOSED
```

Alternative states:

```text
CANCELLED
```

## 30.3 Blind Count

A blind count may hide the current system quantity from counters.

This reduces confirmation bias.

## 30.4 Count Variance

```text
System Quantity: 100
Counted Quantity: 96
Variance: -4
```

After approval:

```text
Debit  Inventory Shrinkage Expense
Credit Inventory
```

---

# 31. Journal Entry Workflow

## 31.1 State Machine

```text
DRAFT
→ SUBMITTED
→ PENDING_APPROVAL
→ APPROVED
→ POSTED
```

Alternative states:

```text
RETURNED
REJECTED
CANCELLED
REVERSED
```

## 31.2 Journal Validations

* Posting period is open
* Journal is active
* Accounts are active
* Accounts allow posting
* Debit equals credit
* Currency is valid
* Exchange rate is valid
* Required dimensions are provided
* Manual posting is permitted
* Approval is complete

## 31.3 Posting Rule

```text
Total Debit = Total Credit
Base Total Debit = Base Total Credit
```

## 31.4 Posted Journal Protection

After posting:

* Lines cannot be changed
* Accounts cannot be changed
* Amounts cannot be changed
* Posting date cannot be changed
* Source reference cannot be removed

Correction uses reversal.

---

# 32. Journal Reversal Workflow

## 32.1 Reversal Process

```text
Select Posted Journal
→ Request Reversal
→ Enter Reason
→ Select Reversal Date
→ Validate Period
→ Approve if Required
→ Create Opposite Journal
→ Link Both Journals
→ Post Reversal
```

## 32.2 Example

Original:

```text
Debit  Expense    $500
Credit Bank       $500
```

Reversal:

```text
Debit  Bank       $500
Credit Expense    $500
```

## 32.3 Reversal Rules

* Original journal remains unchanged
* Reversal references original journal
* Original journal references reversal
* Full reversal is default
* Partial reversal requires explicit supported process
* Reversal date must be in an open period
* Reason is required

## 32.4 Events

```text
JournalReversalRequested
JournalReversed
```

---

# 33. Fiscal Period Closing Workflow

## 33.1 Closing Process

```text
Initiate Close
→ Review Unposted Transactions
→ Reconcile Bank
→ Reconcile Receivables
→ Reconcile Payables
→ Review Inventory
→ Post Depreciation
→ Post Accruals
→ Review Taxes
→ Run Trial Balance
→ Approve Close
→ Lock Period
```

## 33.2 Period States

```text
OPEN
→ SOFT_CLOSED
→ CLOSING
→ CLOSED
→ LOCKED
```

## 33.3 Soft Close

During soft close:

* Ordinary users cannot post
* Finance users may post adjustments
* Reports remain available
* Closing tasks remain active

## 33.4 Hard Close

During hard close:

* No ordinary posting
* Reopening requires senior authorization
* Reopening is audited
* Reason is mandatory

## 33.5 Events

```text
FiscalPeriodSoftClosed
FiscalPeriodClosingStarted
FiscalPeriodClosed
FiscalPeriodReopened
FiscalPeriodLocked
```

---

# 34. Bank Reconciliation Workflow

## 34.1 Process

```text
Import Bank Statement
→ Parse Statement
→ Match Payments
→ Match Receipts
→ Identify Charges
→ Identify Interest
→ Review Unmatched Lines
→ Create Adjustments
→ Approve Reconciliation
→ Close Statement
```

## 34.2 Match Types

* Exact reference match
* Exact amount and date
* Amount within date range
* Multiple payments to one bank line
* One payment to multiple bank lines
* Manual match
* Rule-based match

## 34.3 Accounting Adjustments

Bank charge:

```text
Debit  Bank Charges Expense
Credit Bank
```

Interest received:

```text
Debit  Bank
Credit Interest Income
```

## 34.4 States

```text
IMPORTED
→ MATCHING
→ REVIEW
→ RECONCILED
→ APPROVED
→ CLOSED
```

---

# 35. Approval Workflow State Machine

## 35.1 Workflow Instance States

```text
NOT_STARTED
→ ACTIVE
→ COMPLETED
```

Alternative states:

```text
REJECTED
CANCELLED
EXPIRED
```

## 35.2 Approval Task States

```text
PENDING
→ APPROVED
```

Alternative states:

```text
REJECTED
RETURNED
DELEGATED
ESCALATED
EXPIRED
CANCELLED
```

## 35.3 Sequential Approval

```text
Department Manager
→ Finance Manager
→ Director
```

The next task opens only after the previous task is approved.

## 35.4 Parallel Approval

```text
Finance Approval ─┐
                  ├→ Final Approval
Technical Approval┘
```

## 35.5 Minimum Approval Rule

Example:

```text
Approval Group Members: 5
Minimum Required: 3
```

## 35.6 Workflow Conditions

Conditions may include:

* Amount
* Company
* Branch
* Department
* Cost center
* Supplier risk
* Customer credit
* Product category
* Discount percentage
* Transaction type
* Currency

## 35.7 Delegation

Delegation must verify:

* Effective dates
* Delegate permission
* Conflict rules
* Approval limits
* Segregation of duties

## 35.8 Escalation

Example:

```text
Pending for 24 hours
→ Notify approver

Pending for 48 hours
→ Escalate to manager

Pending for 72 hours
→ Escalate to director
```

---

# 36. Cancellation Rules

Cancellation stops an uncompleted document.

## 36.1 Documents Generally Eligible for Cancellation

* Draft quotation
* Unconfirmed sales order
* Unapproved purchase order
* Unposted invoice
* Unposted payment
* Unposted inventory adjustment

## 36.2 Documents Requiring Reversal Instead

* Posted customer invoice
* Posted supplier invoice
* Posted payment
* Posted journal
* Posted delivery
* Posted goods receipt
* Posted stock adjustment

## 36.3 Cancellation Validation

Before cancellation, check:

* Downstream documents
* Inventory effects
* Accounting effects
* Payment effects
* Workflow status
* External integration state
* Required approval

## 36.4 Cancellation Data

Every cancellation must record:

* Cancelled by
* Cancelled at
* Reason
* Approval where required
* Related reversal
* Correlation ID

---

# 37. Reversal Rules

A reversal creates a new opposite transaction.

## 37.1 Financial Reversal

Creates equal and opposite journal lines.

## 37.2 Inventory Reversal

Creates a stock movement in the opposite direction.

Example delivery reversal:

```text
Original:
Warehouse → Customer

Reversal:
Customer Return Location → Warehouse
```

The system must not assume goods physically returned merely because an accounting reversal was requested.

Physical and financial reversals may require separate workflows.

## 37.3 Payment Reversal

Payment reversal:

```text
Debit  Accounts Receivable
Credit Bank
```

or for supplier payment:

```text
Debit  Bank
Credit Accounts Payable
```

## 37.4 Reversal Restrictions

* Reversal period must be open
* Related later transactions must be considered
* Reconciled payments may require unreconciliation
* Allocations must be reversed
* Downstream reports must update
* Reason is mandatory

---

# 38. Document Closing Rules

Closing ends the remaining unfulfilled portion without reversing completed portions.

Example purchase order:

```text
Ordered: 100
Received: 90
Remaining: 10
```

User may close the remaining quantity with reason:

```text
Supplier unable to deliver remaining quantity
```

Result:

* Received 90 remains valid
* Remaining 10 is cancelled
* Order becomes closed
* Incoming quantity decreases by 10

---

# 39. Backorder Workflow

## 39.1 Sales Backorder

```text
Ordered: 100
Reserved: 60
Backordered: 40
```

Possible actions:

* Wait for replenishment
* Source another warehouse
* Substitute product
* Reduce order
* Cancel remaining quantity

## 39.2 Purchase Backorder

```text
Ordered: 100
Received: 70
Backordered: 30
```

Track:

* Expected date
* Supplier confirmation
* Delay reason
* Customer impact

## 39.3 Events

```text
SalesBackorderCreated
PurchaseBackorderCreated
BackorderFulfilled
BackorderCancelled
```

---

# 40. Exception Management

## 40.1 Common Exception Types

* Insufficient stock
* Credit limit exceeded
* Closed fiscal period
* Unbalanced journal
* Duplicate invoice
* Duplicate payment
* Missing approval
* Price variance
* Quantity variance
* Expired product
* Invalid serial number
* Integration timeout
* Failed notification
* Budget exceeded

## 40.2 Exception Record

A centralized exception record may include:

```text
exception_id
tenant_id
module
exception_type
severity
source_document_type
source_document_id
description
status
assigned_to
created_at
resolved_at
resolution
```

## 40.3 Exception States

```text
OPEN
→ UNDER_REVIEW
→ RESOLVED
```

Alternative states:

```text
APPROVED_OVERRIDE
REJECTED
CLOSED
```

---

# 41. Retry and Idempotency Rules

## 41.1 Retryable Operations

* Email delivery
* SMS delivery
* Webhook delivery
* Search indexing
* Report projection
* External payment verification

## 41.2 Operations Requiring Idempotency

* Invoice posting
* Payment posting
* Mobile-money callback
* Bank transaction import
* Goods receipt posting
* Delivery posting
* External order creation

## 41.3 Idempotency Validation

The system stores:

```text
tenant_id
idempotency_key
operation
request_hash
result
resource_id
```

A retry with the same key:

* Returns original result
* Does not duplicate posting
* Does not duplicate stock
* Does not duplicate payment

---

# 42. Cross-Module Event Catalogue

## CRM and Customer Events

```text
LeadQualified
OpportunityWon
CustomerCreated
CustomerApproved
CustomerCreditBlocked
```

## Sales Events

```text
QuotationAccepted
SalesOrderConfirmed
SalesOrderCancelled
SalesReturnApproved
```

## Procurement Events

```text
PurchaseRequestApproved
PurchaseOrderApproved
PurchaseOrderCancelled
SupplierReturnApproved
```

## Inventory and Warehouse Events

```text
StockReserved
StockReservationFailed
GoodsReceiptPosted
DeliveryPosted
StockTransferred
InventoryAdjusted
StockBelowReorderLevel
```

## Finance Events

```text
CustomerInvoicePosted
SupplierInvoicePosted
CustomerPaymentReceived
SupplierPaymentCompleted
JournalPosted
JournalReversed
FiscalPeriodClosed
```

## Workflow Events

```text
ApprovalRequested
DocumentApproved
DocumentRejected
ApprovalEscalated
```

## Notification Events

```text
NotificationRequested
NotificationDelivered
NotificationFailed
```

---

# 43. Event Reaction Matrix

| Event                    | Main Reactions                                  |
| ------------------------ | ----------------------------------------------- |
| OpportunityWon           | Create quotation option, update forecast        |
| SalesOrderConfirmed      | Request inventory reservation                   |
| StockReserved            | Update sales order reservation state            |
| StockReservationFailed   | Place order on hold or backorder                |
| DeliveryPosted           | Update sales order and request COGS posting     |
| CustomerInvoicePosted    | Update receivable reporting and notify customer |
| CustomerPaymentReceived  | Update invoice payment status                   |
| PurchaseOrderApproved    | Increase expected incoming quantity             |
| GoodsReceiptPosted       | Update purchase order and request GRNI posting  |
| SupplierInvoicePosted    | Update accounts payable                         |
| SupplierPaymentCompleted | Update supplier invoice balance                 |
| InventoryAdjusted        | Update inventory dashboard and financial ledger |
| FiscalPeriodClosed       | Prevent ordinary postings                       |
| ApprovalRequested        | Notify approvers                                |
| DocumentRejected         | Notify creator                                  |

---

# 44. Accounting Posting Matrix

| Business Transaction       | Debit                 | Credit              |
| -------------------------- | --------------------- | ------------------- |
| Goods receipt              | Inventory             | GRNI                |
| Supplier expense invoice   | Expense / Asset       | Accounts Payable    |
| Supplier inventory invoice | GRNI / Variance / Tax | Accounts Payable    |
| Supplier payment           | Accounts Payable      | Bank/Cash           |
| Sales delivery             | Cost of Goods Sold    | Inventory           |
| Customer invoice           | Accounts Receivable   | Revenue and Tax     |
| Customer payment           | Bank/Cash             | Accounts Receivable |
| Customer advance           | Bank/Cash             | Customer Advances   |
| Supplier advance           | Supplier Advances     | Bank/Cash           |
| Customer return stock      | Inventory             | Cost of Goods Sold  |
| Customer credit note       | Sales Return and Tax  | Accounts Receivable |
| Inventory loss             | Inventory Loss        | Inventory           |
| Inventory gain             | Inventory             | Inventory Gain      |
| Bank charge                | Bank Charge Expense   | Bank                |
| Interest received          | Bank                  | Interest Income     |

---

# 45. Inventory Impact Matrix

| Transaction              |              On Hand | Reserved |            Available |         Incoming |        Value |
| ------------------------ | -------------------: | -------: | -------------------: | ---------------: | -----------: |
| Sales order confirmation |                    0 | Increase |             Decrease |                0 |            0 |
| Reservation release      |                    0 | Decrease |             Increase |                0 |            0 |
| Delivery posting         |             Decrease | Decrease |            Usually 0 |                0 |     Decrease |
| Customer sellable return |             Increase |        0 |             Increase |                0 |     Increase |
| Purchase order approval  |                    0 |        0 |                    0 |         Increase |            0 |
| Goods receipt            |             Increase |        0 |             Increase |         Decrease |     Increase |
| Supplier return          |             Decrease |        0 |             Decrease |                0 |     Decrease |
| Transfer dispatch        |      Decrease source |        0 |      Decrease source | Increase transit | Reclassified |
| Transfer receipt         | Increase destination |        0 | Increase destination | Decrease transit | Reclassified |
| Positive adjustment      |             Increase |        0 |             Increase |                0 |     Increase |
| Negative adjustment      |             Decrease |        0 |             Decrease |                0 |     Decrease |

---

# 46. Notification Matrix

| Trigger                    | Recipient                        |
| -------------------------- | -------------------------------- |
| Purchase request submitted | Assigned approver                |
| Purchase order approved    | Procurement officer              |
| Supplier delivery delayed  | Procurement manager              |
| Sales order confirmed      | Warehouse team                   |
| Stock reservation failed   | Sales representative             |
| Customer credit exceeded   | Sales manager and Finance        |
| Goods received             | Procurement and Finance          |
| Invoice overdue            | Customer and collections officer |
| Payment received           | Customer and accountant          |
| Stock below reorder level  | Inventory and Procurement        |
| Approval overdue           | Approver and manager             |
| Fiscal period closing      | Finance team                     |
| Suspicious login           | User and security administrator  |

---

# 47. Audit Requirements per Workflow

Every significant workflow must record:

```text
Tenant
Company
Branch
Document
Action
Actor
Previous State
New State
Date and Time
Reason
Approval
Correlation ID
IP Address where applicable
```

Mandatory audit actions include:

* Create
* Submit
* Approve
* Reject
* Return
* Confirm
* Post
* Cancel
* Reverse
* Reopen
* Override
* Export
* Bank-detail change
* Credit-limit change
* Product-cost change

---

# 48. End-to-End Lead-to-Cash Acceptance Scenario

## Initial Data

* Customer credit limit: $10,000
* Customer outstanding balance: $2,000
* Product stock: 100 units
* Product cost: $7
* Sales price: $10
* Tax rate: 15%

## Transaction

Customer orders:

```text
Quantity: 50
Unit price: $10
Subtotal: $500
Tax: $75
Invoice total: $575
```

## Expected Flow

1. Create or select customer.
2. Create quotation.
3. Approve quotation if required.
4. Customer accepts quotation.
5. Convert quotation to sales order.
6. Credit exposure check passes.
7. Confirm sales order.
8. Reserve 50 units.
9. Create pick task.
10. Pick and pack 50 units.
11. Post delivery.
12. Reduce stock from 100 to 50.
13. Reduce reservation from 50 to 0.
14. Calculate COGS as $350.
15. Post COGS journal.
16. Create customer invoice for $575.
17. Post invoice.
18. Receive customer payment.
19. Allocate payment.
20. Mark invoice paid.
21. Update reports.

## Expected Accounting

Delivery:

```text
Debit  Cost of Goods Sold    $350
Credit Inventory             $350
```

Invoice:

```text
Debit  Accounts Receivable   $575
Credit Sales Revenue         $500
Credit Tax Payable            $75
```

Payment:

```text
Debit  Bank                  $575
Credit Accounts Receivable   $575
```

## Final Results

```text
Stock On Hand: 50
Customer Outstanding: $2,000
New Invoice Outstanding: $0
Revenue Increase: $500
Tax Liability Increase: $75
COGS Increase: $350
Gross Profit: $150
Bank Increase: $575
```

---

# 49. End-to-End Procure-to-Pay Acceptance Scenario

## Initial Data

* Product stock: 20 units
* Purchase quantity: 100 units
* Unit purchase price: $5
* Tax: $75
* Supplier approved
* Purchase budget available

## Expected Flow

1. Create purchase request.
2. Submit for approval.
3. Approve request.
4. Issue RFQ.
5. Receive supplier quotations.
6. Compare quotations.
7. Select supplier.
8. Create purchase order.
9. Approve purchase order.
10. Send order.
11. Receive 100 units.
12. Post goods receipt.
13. Increase stock from 20 to 120.
14. Increase inventory value by $500.
15. Post GRNI accounting.
16. Receive supplier invoice for $575.
17. Match invoice against order and receipt.
18. Approve invoice.
19. Post supplier invoice.
20. Pay supplier.
21. Allocate payment.
22. Update reports.

## Expected Accounting

Goods receipt:

```text
Debit  Inventory                    $500
Credit Goods Received Not Invoiced  $500
```

Supplier invoice:

```text
Debit  Goods Received Not Invoiced  $500
Debit  Recoverable Tax               $75
Credit Accounts Payable             $575
```

Supplier payment:

```text
Debit  Accounts Payable             $575
Credit Bank                         $575
```

## Final Results

```text
Stock On Hand: 120
Inventory Value Increase: $500
Accounts Payable: $0
Recoverable Tax: $75
Bank Decrease: $575
```

---

# 50. Failure Acceptance Scenario: Insufficient Stock

## Situation

```text
Requested Quantity: 20
Available Quantity: 10
Policy: Complete reservation required
```

## Expected Result

* Sales order remains confirmed or on hold based on policy.
* Reservation is not created.
* Stock is not reduced.
* No delivery is created.
* No journal is created.
* `StockReservationFailed` event is recorded.
* Sales representative is notified.
* User receives an actionable business message.

---

# 51. Failure Acceptance Scenario: Invoice Posting Error

## Situation

Revenue account is missing.

## Expected Result

* Invoice posting fails.
* Invoice remains approved but unposted.
* No journal entry exists.
* No receivable balance changes.
* No invoice-posted event is created.
* Error contains correlation ID.
* Finance configuration issue is recorded.

---

# 52. Failure Acceptance Scenario: Duplicate Payment Callback

## Situation

A mobile-money provider sends the same transaction twice.

## Expected Result

* First callback creates and posts payment.
* Second callback is identified by provider reference or idempotency key.
* No second payment is created.
* No duplicate journal entry is posted.
* Original result is returned or duplicate is safely acknowledged.
* Duplicate attempt is logged.

---

# 53. Failure Acceptance Scenario: Closed Fiscal Period

## Situation

User tries to post an invoice dated in a closed period.

## Expected Result

* Posting is rejected.
* Invoice remains unposted.
* User receives `FISCAL_PERIOD_CLOSED`.
* No accounting impact occurs.
* Attempt is audited where appropriate.

---

# 54. Workflow Definition of Done

The workflow-design phase is complete when:

* Lead-to-cash states are approved.
* Procure-to-pay states are approved.
* Reservation rules are accepted.
* Delivery and receipt posting rules are accepted.
* Customer invoice lifecycle is approved.
* Supplier invoice lifecycle is approved.
* Payment allocation rules are approved.
* Customer and supplier return rules are approved.
* Stock-transfer states are approved.
* Inventory-adjustment controls are approved.
* Journal posting and reversal rules are approved.
* Fiscal-period controls are approved.
* Approval workflow behaviour is approved.
* Cancellation and reversal distinctions are understood.
* Accounting posting matrix is accepted.
* Inventory impact matrix is accepted.
* Cross-module events are accepted.
* Failure scenarios are accepted.
* End-to-end scenarios are ready for implementation tests.

---

# 55. Workflow Decision Summary

```text
Operational Documents:
Draft → Approval → Confirmation → Execution → Completion

Financial Documents:
Draft → Approval → Posting → Settlement → Reversal if required

Inventory Source of Truth:
Posted stock movements

Financial Source of Truth:
Posted journal lines

Corrections:
Reversal, return, adjustment, credit note or debit note

Cross-Module Communication:
Application contracts and domain events

Approval:
Central configurable workflow engine

Reliability:
Database transactions, outbox events and idempotency

Historical Integrity:
No direct editing of posted transactions
```

---

# 56. Next Documentation Stage

## Part 6: Security, Multi-Tenancy, Access Control and Compliance Design

The next document will define:

1. Authentication architecture
2. Access and refresh tokens
3. Session management
4. Multi-factor authentication
5. Password policies
6. Tenant isolation
7. Company and branch data scope
8. Role-based access control
9. Policy-based authorization
10. Field-level permissions
11. Segregation of duties
12. Approval authority
13. Sensitive financial controls
14. Payroll and HR privacy
15. Audit architecture
16. Support access controls
17. Encryption
18. Secret management
19. File security
20. API security
21. Webhook security
22. Rate limiting
23. Security monitoring
24. Incident response
25. Compliance readiness
26. Security acceptance tests
