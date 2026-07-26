# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 6: Security, Multi-Tenancy, Access Control and Compliance Design

**Document Status:** Initial Security Architecture Draft
**Depends On:**

* Part 1 — Product Vision and Business Scope
* Part 2 — Detailed Business Requirements
* Part 3 — System Architecture and Domain Design
* Part 4 — Database Domain Model and ERD Design
* Part 5 — Detailed Module Workflows and Accounting Impact

**Architecture:** Multi-Tenant Modular Monolith
**Primary Database:** PostgreSQL
**Security Model:** Defense in Depth
**Authorization Model:** RBAC, Data Scope, Policy-Based Authorization and Segregation of Duties

---

# 1. Purpose of This Document

This document defines the security architecture of the ERP platform.

It explains how the system will protect:

* Tenant data
* Company data
* Financial records
* Inventory records
* Customer information
* Supplier information
* Employee information
* Payroll information
* Authentication credentials
* Uploaded documents
* APIs
* Integrations
* Administrative operations
* Audit evidence

The objective is to ensure that access is not controlled by one login check only.

Security must exist at several layers:

```text
User Authentication
        ↓
Session Validation
        ↓
Tenant Membership
        ↓
Role and Permission Check
        ↓
Company and Branch Scope
        ↓
Record-Level Policy
        ↓
Field-Level Security
        ↓
Business Rule Validation
        ↓
Audit Logging
```

---

# 2. Security Objectives

The ERP platform must preserve the following security properties.

## 2.1 Confidentiality

Only authorized users may view sensitive information.

Examples:

* Employee salaries
* Supplier bank accounts
* Customer credit information
* Product cost
* Financial statements
* Tax records
* Payroll deductions
* Authentication secrets

## 2.2 Integrity

Unauthorized or accidental changes must be prevented.

Examples:

* Posted journals cannot be edited.
* Posted stock movements cannot be deleted.
* Supplier bank details require verification.
* Customer credit limits require permission.
* Payroll results require approval.

## 2.3 Availability

Authorized users must be able to use the platform when required.

Security controls must not create unnecessary system failure or lock out all legitimate users.

## 2.4 Accountability

The system must identify:

* Who performed an action
* What action was performed
* When it happened
* Which tenant and company were affected
* What data changed
* Why an override occurred

## 2.5 Tenant Isolation

One tenant must never access another tenant’s business data.

## 2.6 Least Privilege

Users, services and infrastructure components receive only the access they require.

## 2.7 Non-Repudiation

Sensitive approvals and postings must retain enough evidence to show that the recorded actor performed the action.

---

# 3. Security Threat Model

The ERP must consider threats from:

* External attackers
* Compromised user accounts
* Malicious employees
* Overprivileged administrators
* Accidental data exposure
* Misconfigured integrations
* Vulnerable dependencies
* Injection attacks
* Broken authorization
* Cross-tenant access
* Stolen tokens
* Session hijacking
* File upload attacks
* Duplicate payment callbacks
* Webhook forgery
* Log data leakage
* Backup exposure
* Insider fraud
* Unauthorized exports

---

# 4. Security Trust Boundaries

The major trust boundaries are:

```text
Public Internet
        ↓
Edge Security Layer
        ↓
Frontend Application
        ↓
Backend API
        ↓
Application Modules
        ↓
Database, Redis and Object Storage
        ↓
External Integrations
```

Each boundary requires independent validation.

The backend must not trust:

* Frontend validation
* Hidden UI buttons
* Client-provided tenant IDs
* Client-calculated totals
* Client-provided permissions
* Uploaded filenames
* External webhook requests
* Cached authorization decisions without expiration

---

# 5. Authentication Architecture

The recommended authentication model is:

```text
User Credentials
        ↓
Authentication Service
        ↓
Short-Lived Access Token
        +
Rotating Refresh Token
        +
Server-Side Session Record
```

## 5.1 Access Token

The access token should be short-lived.

Suggested lifetime:

```text
10–20 minutes
```

It may contain:

* User ID
* Session ID
* Active tenant ID
* Token version
* Issued-at time
* Expiration time
* Authentication assurance level

It should not contain:

* Password
* Full permission matrix
* Sensitive employee information
* Permanent organization access rules
* Supplier or customer data

## 5.2 Refresh Token

The refresh token should:

* Be long and cryptographically random
* Be stored securely
* Be rotated after use
* Be revocable
* Be linked to one session
* Be stored as a hash in the database
* Have a defined expiration time
* Be invalidated after password reset where appropriate

## 5.3 Server-Side Session

The session record should include:

```text
session_id
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

## 5.4 Login Identifiers

Users may log in with:

* Email
* Username
* Approved phone number

Login identifiers must be unique within the configured tenant scope.

## 5.5 Login Response

A successful login should return:

* Access token
* Session information
* Tenant memberships
* User profile summary
* Required security actions
* Available companies and branches

Sensitive permission rules should still be loaded or verified server-side.

---

# 6. Password Security

## 6.1 Password Hashing

Passwords must be stored using a strong password hashing algorithm.

Recommended:

* Argon2id
* Bcrypt with an appropriate work factor

Passwords must never be stored in plaintext or reversible encryption.

## 6.2 Password Policy

Configurable requirements may include:

* Minimum length
* Maximum length
* Common-password rejection
* Password history
* Compromised-password screening
* Required password change after administrator reset
* Maximum password age for selected privileged users

A modern default should prioritize password length over excessive character-combination rules.

## 6.3 Temporary Password

Temporary passwords must:

* Expire
* Require change at first login
* Be transmitted through a secure channel
* Not be visible again after creation

## 6.4 Password Reset

Password reset flow:

```text
Request Reset
→ Generate Single-Use Token
→ Deliver Securely
→ Validate Token
→ Set New Password
→ Revoke Existing Sessions
→ Record Security Event
```

Reset tokens must:

* Expire quickly
* Be single-use
* Be stored as hashes
* Be tenant-aware
* Not reveal whether an account exists

---

# 7. Multi-Factor Authentication

## 7.1 Supported Methods

Initial methods may include:

* Authenticator application using TOTP
* Email one-time code
* SMS one-time code
* Recovery codes

Later options may include:

* Passkeys
* Hardware security keys
* Enterprise identity providers

## 7.2 Mandatory MFA Roles

MFA should be mandatory or strongly recommended for:

* Platform administrators
* Tenant owners
* Tenant administrators
* Finance managers
* Payroll officers
* Security administrators
* Users managing bank details
* Users approving high-value payments

## 7.3 Step-Up Authentication

Sensitive actions may require recent MFA confirmation even when the user is already logged in.

Examples:

* Change supplier bank account
* Approve payroll
* Reopen fiscal period
* Export payroll data
* Create platform administrator
* Disable audit controls
* Approve high-value payment
* Change tenant security configuration

## 7.4 Recovery Codes

Recovery codes must:

* Be generated once
* Be shown once
* Be stored hashed
* Be single-use
* Be regenerated after compromise

---

# 8. Account Lifecycle

## 8.1 User Statuses

```text
INVITED
ACTIVE
LOCKED
SUSPENDED
INACTIVE
TERMINATED
```

## 8.2 Invited

The user has received an invitation but has not completed activation.

## 8.3 Active

The user can authenticate and use authorized functionality.

## 8.4 Locked

The account is temporarily blocked because of:

* Failed login attempts
* Security policy
* Suspicious activity
* Administrator action

## 8.5 Suspended

The user cannot log in, but historical records remain.

## 8.6 Inactive

The account is retained but not currently in use.

## 8.7 Terminated

Access is permanently disabled.

The user’s historical actions and business records remain.

## 8.8 Employee Termination

When an employee leaves:

1. Disable login
2. Revoke active sessions
3. Remove delegations
4. Reassign pending approvals
5. Transfer owned tasks
6. Preserve historical records
7. Audit the termination
8. Review service-account access
9. Review exported files and devices

---

# 9. Login Protection

## 9.1 Failed Login Limits

The system should apply:

* Progressive delay
* Temporary lockout
* IP-aware rate limiting
* Device-aware monitoring
* Security notification for suspicious patterns

## 9.2 User Enumeration Protection

Login and reset responses should not reveal whether a username or email exists.

Use a generic response such as:

```text
The login credentials are invalid.
```

## 9.3 Suspicious Login Detection

Potential indicators:

* New country
* New device
* Impossible travel
* Unusual login time
* Multiple failed MFA attempts
* Repeated IP changes
* Access from blocked networks

The system may:

* Require MFA
* Notify the user
* Terminate the session
* Create a security incident
* Require administrator review

---

# 10. Session Management

## 10.1 Session Controls

Users should be able to:

* View active sessions
* See device and approximate location
* Revoke one session
* Revoke all other sessions

Administrators should be able to revoke sessions under controlled permission.

## 10.2 Session Expiration

Support:

* Absolute expiration
* Inactivity timeout
* Refresh-token expiration
* Privileged-session shorter lifetime

## 10.3 Session Revocation Events

Sessions should be revoked when:

* User logs out
* Password changes
* Account is suspended
* Tenant membership is removed
* Major permission changes occur
* Security incident is detected
* Administrator forces logout

## 10.4 Concurrent Session Policy

Tenants may configure:

* Unlimited approved sessions
* Maximum sessions per user
* Single privileged session
* Block unknown devices
* Require approval for new devices

---

# 11. Tenant Isolation Model

Tenant isolation is one of the highest-priority security requirements.

## 11.1 Trusted Tenant Context

The authoritative tenant context comes from:

```text
Authenticated Session
        ↓
Verified Tenant Membership
        ↓
Server-Side Tenant Context
```

The client may request to switch tenant, but the server must verify membership.

The client must not be allowed to define an unrestricted tenant ID in a request body.

## 11.2 Tenant-Owned Data

Every tenant-owned table must contain:

```text
tenant_id
```

Tenant context must also exist in:

* Cache keys
* Queue jobs
* Events
* Search documents
* File paths
* Reports
* Export jobs
* Audit logs
* Integration configurations

## 11.3 Database Query Rules

Every tenant-owned repository operation must require a tenant context.

Unsafe:

```text
findCustomerById(customerId)
```

Safer:

```text
findCustomerById(tenantId, customerId)
```

## 11.4 Tenant Filtering

Tenant filtering should be implemented through:

* Repository abstractions
* Query middleware
* Database constraints
* Automated tests
* Optional PostgreSQL Row-Level Security

## 11.5 Tenant-Safe Uniqueness

Examples:

```text
UNIQUE (tenant_id, customer_number)
UNIQUE (tenant_id, product_code)
UNIQUE (tenant_id, supplier_number)
```

## 11.6 Cross-Tenant References

A record from one tenant must never reference a record from another tenant.

This must be prevented through:

* Composite foreign keys where practical
* Application validation
* Trusted repository context
* Integration tests

---

# 12. PostgreSQL Row-Level Security

PostgreSQL Row-Level Security may provide an additional isolation layer.

Example policy concept:

```text
tenant_id = current_setting('app.current_tenant_id')::uuid
```

Within a database transaction:

```text
SET LOCAL app.current_tenant_id = '<trusted-tenant-id>';
```

## 12.1 Benefits

* Additional protection from missing tenant filters
* Strong database-level isolation
* Useful defense against repository mistakes

## 12.2 Risks

* Incorrect configuration may block legitimate queries
* Connection pooling must reset context safely
* Platform-level operations require controlled bypass
* Background jobs must set the correct tenant context

## 12.3 Decision

Row-Level Security is recommended for sensitive tenant-owned tables after a tested implementation pattern is established.

It does not replace application authorization.

---

# 13. Tenant Switching

A user may belong to multiple tenants.

Tenant switching flow:

```text
User Requests Tenant Switch
        ↓
Verify Active Membership
        ↓
Verify Tenant Status
        ↓
Create New Trusted Tenant Context
        ↓
Issue Updated Access Token
        ↓
Audit Tenant Switch
```

A suspended or terminated tenant cannot be selected.

---

# 14. Company and Branch Data Scope

Tenant membership alone does not grant access to every company.

## 14.1 Organization Scope Types

```text
TENANT
COMPANY
BRANCH
DEPARTMENT
COST_CENTER
TEAM
OWN_RECORDS
CUSTOM
```

## 14.2 Example

A sales representative may have:

```text
Tenant: Tenant A
Company: Distribution Company
Branch: Mogadishu
Department: Sales
Scope: Own customers and own quotations
```

A finance manager may have:

```text
Company-wide finance access
All branches
Posting permission
No payroll permission
```

## 14.3 Server-Side Verification

For every scoped request, the backend must verify:

1. Tenant access
2. Company access
3. Branch access
4. Department access where applicable
5. Resource permission
6. Record ownership or assigned scope

---

# 15. Role-Based Access Control

## 15.1 Role Definition

A role groups permissions.

Examples:

* Tenant Administrator
* Finance Manager
* Accountant
* Cashier
* Sales Manager
* Sales Representative
* Procurement Manager
* Buyer
* Warehouse Manager
* Storekeeper
* Auditor

## 15.2 Permission Structure

Recommended permission format:

```text
resource.action
```

Examples:

```text
customer.view
customer.create
customer.approve
customer.export

sales_order.view
sales_order.create
sales_order.submit
sales_order.confirm
sales_order.cancel

journal_entry.create
journal_entry.approve
journal_entry.post
journal_entry.reverse
```

## 15.3 Permission Actions

Common actions:

* View
* Create
* Edit
* Delete draft
* Submit
* Approve
* Reject
* Confirm
* Post
* Cancel
* Reverse
* Reopen
* Import
* Export
* Print
* Configure

## 15.4 System Roles and Custom Roles

System roles:

* Created by the platform
* Provide safe defaults
* May be copied
* Should not be destructively edited

Custom roles:

* Created by tenant administrators
* Must follow conflict checks
* Must be audited
* May be versioned

---

# 16. Policy-Based Authorization

Permissions alone cannot decide every business action.

Example:

```text
purchase_order.approve
```

does not automatically mean the user can approve every purchase order.

A policy may also check:

* Order amount
* Company
* Branch
* Department
* Cost center
* Approval workflow
* User approval limit
* Creator identity
* Supplier risk
* Budget status

## 16.1 Policy Decision

A policy should return:

```text
ALLOW
DENY
REQUIRES_ADDITIONAL_APPROVAL
```

It should also return a stable reason code.

Example:

```text
APPROVAL_LIMIT_EXCEEDED
SEGREGATION_OF_DUTIES_CONFLICT
WRONG_COMPANY_SCOPE
WORKFLOW_NOT_ASSIGNED
```

---

# 17. Record-Level Authorization

Some permissions depend on the record.

Examples:

* Salesperson can edit only their draft quotations.
* Manager can view team quotations.
* Accountant can view invoices for assigned company.
* Storekeeper can process warehouse tasks assigned to their warehouse.
* Auditor has read-only access to approved financial records.

Record-level policies may use:

* Created by
* Assigned user
* Assigned team
* Branch
* Department
* Document status
* Workflow assignment
* Confidentiality classification

---

# 18. Field-Level Security

Some records contain fields that require stronger protection than the record itself.

## 18.1 Sensitive Fields

Examples:

* Product cost
* Customer credit limit
* Customer risk rating
* Supplier bank account
* Employee salary
* Payroll deductions
* Bank account numbers
* Tax identification
* Authentication metadata

## 18.2 Field-Level Actions

A field may support separate permissions for:

* View
* Edit
* Export
* Reveal full value
* Approve change

## 18.3 Masking

Examples:

```text
Bank account: **** **** 4567
Phone: +252 *** *** 890
National ID: ******1234
```

Users without reveal permission see masked values.

## 18.4 API Response Filtering

Field-level security must be enforced in backend response serialization.

Hiding a field in the frontend is not sufficient.

---

# 19. Segregation of Duties

Segregation of duties reduces fraud and error by separating conflicting responsibilities.

## 19.1 Common Conflicts

```text
Create Supplier
+
Approve Supplier
```

```text
Create Payment
+
Approve Payment
```

```text
Create Journal
+
Post Journal
```

```text
Prepare Payroll
+
Approve Payroll
```

```text
Count Inventory
+
Approve Inventory Adjustment
```

## 19.2 Conflict Types

### Preventive Conflict

The system blocks the assignment or action.

### Detective Conflict

The system permits the action but creates a warning or review item.

### Compensating Control

The system requires:

* Additional approval
* MFA
* Mandatory reason
* Manager review
* Audit alert

## 19.3 Conflict Evaluation

Conflicts must be checked during:

* Role creation
* Role assignment
* Approval execution
* Temporary delegation
* Permission updates
* Emergency-access activation

---

# 20. Approval Authority

Approval permission and approval amount are separate controls.

Example:

```text
Finance Manager:
Can approve purchase orders
Maximum approval amount: $25,000
```

A purchase order of $30,000 must move to a higher approver.

## 20.1 Approval Dimensions

Approval authority may depend on:

* Amount
* Currency
* Company
* Branch
* Department
* Cost center
* Document type
* Supplier category
* Product category
* Risk level

## 20.2 Currency Conversion

When approval limits use a base currency, the system must convert the document amount using the approved exchange rate.

The exchange rate used in the approval decision should be retained for audit.

---

# 21. Administrative Access

Tenant administrators should not automatically receive unrestricted access to all financial or payroll data.

Administrative permission should be separated into:

* User administration
* Configuration administration
* Security administration
* Business-data administration
* Financial-data access
* Payroll-data access

This limits unnecessary sensitive access.

---

# 22. Platform Administrator Security

Platform administrators manage SaaS operations but should not freely browse tenant business data.

## 22.1 Default Access

Default platform access should include:

* Tenant metadata
* Subscription status
* Technical health
* Error logs with masked business information
* Storage and usage metrics

## 22.2 Tenant Business Data Access

Access to tenant data requires controlled support mode.

Support access should be:

* Requested
* Approved
* Time-limited
* Purpose-limited
* Read-only by default
* Fully audited
* Visible to the tenant
* Automatically expired

## 22.3 Support Access States

```text
REQUESTED
APPROVED
ACTIVE
EXPIRED
REVOKED
DENIED
```

---

# 23. Emergency Access

The platform may later support controlled emergency access, sometimes called break-glass access.

Use cases:

* Critical system recovery
* Urgent financial correction
* Locked-out tenant administration
* Incident investigation

Requirements:

* Strong MFA
* Mandatory reason
* Short expiration
* Senior approval
* Enhanced logging
* Immediate notification
* Post-action review

Emergency access must not silently bypass audit controls.

---

# 24. Finance Security Controls

Finance requires stronger protection because it controls monetary records.

## 24.1 Sensitive Finance Actions

* Create journal
* Approve journal
* Post journal
* Reverse journal
* Reopen fiscal period
* Change chart of accounts
* Create payment
* Approve payment
* Modify bank account
* Export financial statements
* Change exchange rate
* Approve credit note

## 24.2 Required Controls

Depending on risk:

* MFA
* Dual approval
* Approval limit
* Segregation of duties
* Mandatory reason
* Attachment
* Audit alert
* Session reauthentication

## 24.3 Posted Financial Records

Posted records must be:

* Read-only
* Version-protected
* Reversed rather than overwritten
* Linked to the original source document
* Included in audit reporting

---

# 25. Bank Account Security

## 25.1 Storage

Sensitive bank account values should be encrypted.

Store:

* Encrypted full value
* Masked display value
* Last four digits
* Verification status

## 25.2 Bank Detail Change Workflow

```text
Change Requested
→ Identity Reauthentication
→ Independent Verification
→ Approval
→ Activation
→ Notification
→ Audit Review
```

## 25.3 Supplier Bank Fraud Prevention

Controls may include:

* Dual approval
* Cooling-off period
* Payment hold after change
* Verification call
* Attachment requirement
* Notification to Finance Manager
* Comparison with previous details

---

# 26. Customer Credit Security

Sensitive actions include:

* Create credit profile
* Increase credit limit
* Remove credit block
* Approve credit override
* Change payment terms
* Write off receivable balance

Credit overrides must record:

* Requested amount
* Current exposure
* Approved limit
* Approver
* Reason
* Effective period

---

# 27. Inventory Security Controls

Sensitive inventory actions:

* Stock adjustment
* Damage write-off
* Expiry write-off
* Negative stock override
* Reservation override
* Serial-number correction
* Inventory-count approval
* Warehouse transfer

Controls may include:

* Reason code
* Attachment
* Value-based approval
* Counter and approver separation
* Warehouse scope
* Audit alert
* Period lock

---

# 28. HR and Payroll Privacy

HR and payroll contain highly sensitive personal and compensation data.

## 28.1 HR Access Areas

Separate permissions should exist for:

* Basic employee profile
* Contact information
* Employment contract
* Salary
* Benefits
* Disciplinary records
* Medical or protected documents
* Performance reviews
* Payroll results

## 28.2 Payroll Roles

Possible roles:

* Payroll Preparer
* Payroll Reviewer
* Payroll Approver
* Payroll Auditor
* Employee Self-Service User

## 28.3 Payroll Segregation

The person who prepares payroll should not be the sole approver.

## 28.4 Employee Self-Service

Employees should access only:

* Their profile
* Their payslips
* Their leave
* Their attendance
* Their approved documents
* Their tax information where applicable

## 28.5 Manager Access

Managers may access selected team information but should not automatically see employee salaries.

---

# 29. Data Classification

The platform should classify data.

## 29.1 Public

Examples:

* Public product information
* Published company contact details

## 29.2 Internal

Examples:

* Internal procedures
* Non-sensitive operational dashboards

## 29.3 Confidential

Examples:

* Customer balances
* Supplier contracts
* Product costs
* Financial reports

## 29.4 Restricted

Examples:

* Password hashes
* MFA secrets
* Payroll information
* Bank account details
* Authentication tokens
* Employee protected records

Security controls should become stronger as classification increases.

---

# 30. Encryption in Transit

All production network communication must use TLS.

This includes:

* Browser to API
* API to external provider
* Application to database where supported
* Application to Redis
* Object-storage access
* Administrative connections

Plain HTTP should only be allowed in isolated local development.

---

# 31. Encryption at Rest

Encryption at rest should protect:

* Database storage
* Backups
* Object storage
* Logs
* Redis persistence where enabled
* Encrypted configuration secrets

Highly sensitive fields may require application-level encryption in addition to infrastructure encryption.

Examples:

* Supplier bank account
* Bank account number
* Integration secret
* MFA secret
* Private API credential

---

# 32. Encryption Key Management

Keys must not be stored directly in source code.

Use:

* Cloud key management
* Secret manager
* Secure environment injection
* Controlled local-development secrets

Key-management requirements:

* Rotation
* Access control
* Audit logging
* Environment separation
* Emergency revocation
* Backup and recovery

---

# 33. Secret Management

Secrets include:

* Database passwords
* JWT signing keys
* Encryption keys
* Redis credentials
* Object-storage credentials
* Email credentials
* SMS credentials
* WhatsApp credentials
* Payment-provider secrets
* Webhook secrets

Secrets must not appear in:

* Git repository
* Frontend code
* Error messages
* Logs
* Screenshots
* Documentation examples using real values

---

# 34. API Security

## 34.1 Input Validation

Every API input must be validated for:

* Data type
* Length
* Format
* Allowed values
* Required fields
* Business constraints

## 34.2 Injection Protection

Use:

* Parameterized queries
* ORM query builders
* Safe dynamic filtering
* Input normalization
* No string-concatenated SQL

## 34.3 Mass Assignment Protection

The backend must explicitly define editable fields.

A user must not be able to submit hidden fields such as:

```text
is_admin
approved_by
posted_at
tenant_id
credit_limit
```

unless specifically allowed.

## 34.4 Rate Limiting

Apply rate limits by:

* IP
* User
* Tenant
* Endpoint
* API client

Stricter limits should apply to:

* Login
* Password reset
* MFA verification
* Export
* Search
* Webhooks
* Public forms

## 34.5 Request Size Limits

Set limits for:

* JSON body
* File uploads
* Number of records in bulk requests
* Export size
* Search complexity

## 34.6 API Versioning

Use stable API versions:

```text
/api/v1
```

Security-sensitive deprecations should have controlled migration plans.

---

# 35. Cross-Site Security

## 35.1 Cross-Site Scripting

Controls:

* Escape output
* Sanitize rich text
* Use safe UI components
* Restrict dangerous HTML
* Apply Content Security Policy
* Avoid unsafe DOM injection

## 35.2 Cross-Site Request Forgery

When using cookies:

* SameSite configuration
* CSRF tokens
* Origin checking
* Secure and HttpOnly cookies

If authorization uses bearer tokens outside cookies, token storage still requires careful protection.

## 35.3 Content Security Policy

A restrictive Content Security Policy should control:

* Script sources
* Image sources
* Frame sources
* Connection endpoints
* Object loading

---

# 36. Token Storage

For browser applications, sensitive long-lived refresh tokens should preferably use:

* Secure
* HttpOnly
* SameSite cookies

Access tokens may be held in memory rather than persistent browser storage when practical.

Avoid storing long-lived sensitive tokens in localStorage because browser script compromise can expose them.

---

# 37. File Upload Security

## 37.1 Validation

Validate:

* MIME type
* File extension
* File signature
* File size
* Filename
* Tenant context
* Related record permission

## 37.2 Malware Scanning

Uploaded files should be scanned before becoming available.

Scan statuses:

```text
PENDING
CLEAN
INFECTED
FAILED
QUARANTINED
```

## 37.3 Storage

Files should use generated storage keys.

Unsafe:

```text
/uploads/customer_invoice.pdf
```

Safer:

```text
/prod/{tenant_id}/{module}/{record_id}/{file_id}
```

## 37.4 Download

Before generating a download URL:

1. Authenticate user
2. Validate tenant
3. Validate record permission
4. Validate file classification
5. Generate short-lived signed URL
6. Audit sensitive download where required

## 37.5 Public Files

Files are private by default.

Public access must be explicitly enabled for selected content.

---

# 38. Export Security

Data export creates a high risk of bulk information leakage.

## 38.1 Export Permissions

Exports require separate permissions.

Examples:

```text
customer.export
financial_report.export
payroll.export
audit_log.export
```

## 38.2 Export Controls

* Tenant scope
* Company scope
* Field-level filtering
* Row-count limits
* Background processing
* Time-limited file
* Encrypted export option
* Download audit
* Watermarking where appropriate

## 38.3 Sensitive Exports

Payroll or bank-detail exports may require:

* MFA
* Additional approval
* Reason
* Expiration
* Notification
* Restricted recipients

---

# 39. Webhook Security

## 39.1 Outgoing Webhooks

Outgoing webhook requests should include:

* Event ID
* Timestamp
* Signature
* Event type
* Delivery attempt
* Tenant-safe payload

Use HMAC signatures with a tenant-specific secret.

## 39.2 Incoming Webhooks

Validate:

* Signature
* Timestamp
* Allowed clock difference
* Provider identity
* Event ID
* Idempotency
* Source restrictions where practical

## 39.3 Replay Protection

Reject or safely ignore previously processed event IDs.

A webhook timestamp that is too old should be rejected unless the provider has a documented retry model.

---

# 40. Integration Security

External integrations should use separate service accounts.

Each integration should have:

* Client ID
* Secret or certificate
* Allowed permissions
* Allowed tenant
* Rate limit
* IP restrictions where supported
* Expiration
* Last-used timestamp
* Revocation controls

Integrations must not reuse normal employee credentials.

---

# 41. Internal Event Security

Domain events may contain sensitive business information.

Events should include only data needed by consumers.

Avoid publishing:

* Full passwords
* Tokens
* Full bank account numbers
* Payroll details unless required
* Unnecessary personal information

Event consumers must validate:

* Tenant ID
* Event type
* Event version
* Processing idempotency
* Expected source

---

# 42. Cache Security

Cache keys must be tenant-aware.

Unsafe:

```text
customer:123
```

Safe:

```text
erp:prod:tenant_001:customer:123
```

Authorization caches must:

* Expire
* Be invalidated after role changes
* Include tenant and user context
* Never replace source-of-truth checks for high-risk actions

Sensitive values should not be cached unless required and protected.

---

# 43. Background Job Security

Every job must include trusted context:

```text
job_id
tenant_id
requested_by
job_type
correlation_id
payload
```

Workers must:

* Set tenant context
* Recheck permissions where appropriate
* Validate payload
* Avoid trusting client-created job data
* Mask sensitive errors
* Record audit events
* Prevent cross-tenant execution

---

# 44. Logging Security

Logs must not contain:

* Passwords
* Access tokens
* Refresh tokens
* MFA secrets
* Full bank account numbers
* Full card details
* Encryption keys
* Sensitive payroll data
* Private document contents

Logs may include:

* Tenant ID
* User ID
* Correlation ID
* Event type
* Error code
* Record ID
* Masked reference

---

# 45. Audit Architecture

Audit logs are separate from operational application logs.

## 45.1 Audit Categories

```text
BUSINESS
SECURITY
ADMINISTRATIVE
INTEGRATION
SUPPORT_ACCESS
DATA_EXPORT
```

## 45.2 Required Audit Events

* Login success
* Login failure
* MFA change
* Password reset
* User creation
* Account suspension
* Role assignment
* Permission change
* Tenant switch
* Supplier bank change
* Customer credit-limit change
* Product-cost change
* Document approval
* Document posting
* Document cancellation
* Document reversal
* Fiscal-period reopening
* Sensitive export
* Support access

## 45.3 Audit Record Fields

```text
event_id
tenant_id
company_id
branch_id
actor_user_id
actor_type
event_category
event_type
record_type
record_id
action
previous_values
new_values
reason
ip_address
user_agent
correlation_id
occurred_at
```

## 45.4 Append-Only Policy

Ordinary application users must not update or delete audit records.

Retention and archival should use controlled platform processes.

---

# 46. Audit Data Protection

Audit data may itself contain sensitive values.

Use:

* Field masking
* Selective snapshots
* Encryption
* Restricted audit roles
* Export permission
* Retention controls

Do not copy full restricted records into audit payloads when a summarized change is sufficient.

---

# 47. Security Monitoring

The platform should monitor:

* Failed logins
* MFA failures
* Account lockouts
* Permission escalations
* Suspicious exports
* Repeated access denials
* Cross-tenant access attempts
* Unusual payment activity
* Supplier bank changes
* Fiscal-period reopening
* Abnormal stock adjustments
* Audit-service failures
* Webhook signature failures

---

# 48. Security Alert Severity

Suggested levels:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Examples:

## Low

* One failed login
* Expired session

## Medium

* Repeated failed login
* Unusual device
* Repeated rejected access

## High

* Supplier bank account changed
* Large unauthorized export attempt
* Permission escalation
* Multiple tenant-access violations

## Critical

* Confirmed cross-tenant data exposure
* Stolen administrator credentials
* Audit logging disabled
* Unauthorized payment posted
* Encryption key compromise

---

# 49. Incident Response

## 49.1 Incident Lifecycle

```text
DETECTED
→ TRIAGED
→ CONTAINED
→ INVESTIGATED
→ REMEDIATED
→ RECOVERED
→ REVIEWED
→ CLOSED
```

## 49.2 Incident Record

Include:

* Incident ID
* Severity
* Tenant impact
* Systems affected
* Detection method
* Timeline
* Actions taken
* Evidence
* Root cause
* Resolution
* Follow-up tasks

## 49.3 Immediate Response Examples

For compromised account:

1. Revoke sessions
2. Lock account
3. Force password reset
4. Review audit history
5. Review role changes
6. Notify tenant administrator
7. Investigate data access
8. Restore safe access

For suspected tenant leakage:

1. Block affected endpoint
2. Preserve logs
3. Identify affected records
4. Confirm tenant scope
5. Contain exposure
6. Notify responsible teams
7. Correct defect
8. Add regression test
9. Review disclosure obligations

---

# 50. Vulnerability Management

Security maintenance should include:

* Dependency scanning
* Container scanning
* Static application security testing
* Secret scanning
* Dynamic security testing
* Database configuration review
* Infrastructure review
* Penetration testing
* Patch management

High-risk vulnerabilities should block production deployment until reviewed.

---

# 51. Secure Development Lifecycle

Security should be part of development from the beginning.

## 51.1 Requirements

Define security acceptance criteria for each feature.

## 51.2 Design

Perform threat modelling for:

* Authentication
* Multi-tenancy
* Payments
* Payroll
* File upload
* Integrations
* Financial posting

## 51.3 Implementation

Use:

* Code review
* Secure coding guidelines
* Type safety
* Validation
* Least privilege
* Safe error handling

## 51.4 Testing

Run:

* Unit tests
* Integration tests
* Authorization tests
* Tenant-isolation tests
* Security scans
* Abuse-case tests

## 51.5 Deployment

Verify:

* Environment separation
* Secret injection
* TLS
* Security headers
* Monitoring
* Backup
* Rollback

---

# 52. Environment Separation

Separate:

```text
Development
Testing
Staging
Production
```

Each environment should have:

* Separate credentials
* Separate databases
* Separate encryption keys
* Separate storage
* Separate integrations
* Separate logs

Production data must not be copied into development without approved masking.

---

# 53. Database Security

## 53.1 Database Accounts

Use separate credentials for:

* Application
* Migration
* Reporting
* Backup
* Administration

The application database user should not have unnecessary administrative privileges.

## 53.2 Query Access

Business modules should use repositories rather than unrestricted raw database access.

## 53.3 Migration Security

Production migrations require:

* Review
* Backup readiness
* Controlled execution
* Rollback or recovery plan
* Audit trail

## 53.4 Reporting Access

Reporting users should have read-only access to approved views or reporting stores.

---

# 54. Redis Security

Redis should use:

* Authentication
* TLS where supported
* Private network
* Restricted commands
* Environment separation
* Memory limits
* Backup only where required

Redis must not be publicly exposed.

---

# 55. Object Storage Security

Object storage should use:

* Private buckets
* Tenant-scoped keys
* Encryption
* Short-lived signed URLs
* Versioning
* Retention rules
* Access logs
* Lifecycle policies
* Malware scanning workflow

---

# 56. Backup Security

Backups must be:

* Encrypted
* Access controlled
* Retained according to policy
* Stored separately from production
* Monitored
* Restore tested

Backup access should be more restricted than ordinary application access.

---

# 57. Data Retention and Deletion

Retention depends on data type.

Examples:

* Financial records
* Tax records
* Audit logs
* Payroll records
* Employee documents
* Security logs
* Export files
* Temporary imports

## 57.1 Retention Principles

* Preserve legally required records
* Remove expired temporary files
* Delete revoked refresh tokens after safe retention
* Archive old audit records
* Support tenant termination workflow
* Avoid deleting posted financial history

## 57.2 Tenant Termination

Possible stages:

```text
Active
→ Suspended
→ Export Window
→ Retention Period
→ Scheduled Deletion
→ Deleted or Anonymized
```

Deletion must include:

* Database records
* Object storage
* Search indexes
* Cache
* Queued jobs
* Analytics copies
* Backups according to retention policy

---

# 58. Privacy Design

The platform should support privacy principles such as:

* Data minimization
* Purpose limitation
* Access control
* Correction
* Retention
* Export
* Deletion where legally permitted
* Auditability

The platform should not collect sensitive personal information without a defined business purpose.

---

# 59. Compliance Readiness

The initial product may not claim formal certification immediately, but the architecture should support future compliance.

Potential areas:

* Financial audit readiness
* Data-protection obligations
* Access-control review
* Security incident management
* Backup and recovery
* Change management
* Vendor management
* Business continuity
* Record retention

Possible future frameworks may include:

* ISO 27001 readiness
* SOC 2 readiness
* Regional privacy requirements
* Industry-specific regulations
* Financial-control frameworks

Formal compliance requires policies, evidence and operational processes in addition to software features.

---

# 60. Access Review

Tenants should periodically review access.

Review areas:

* Active users
* Dormant users
* Privileged roles
* Conflicting permissions
* Temporary delegations
* Service accounts
* Payroll access
* Finance access
* Support access
* Export permissions

Access reviews may be:

* Monthly
* Quarterly
* Annually
* Triggered by role change
* Triggered by employee termination

---

# 61. Role Change Workflow

```text
Role Change Requested
→ Manager Approval
→ Security Review
→ Conflict Check
→ Effective Date
→ Apply Change
→ Revoke Authorization Cache
→ Audit
→ Notify User
```

High-risk role changes may require MFA and dual approval.

---

# 62. Service Account Security

Service accounts should:

* Belong to one tenant
* Have narrow permissions
* Have expiration where possible
* Use secret rotation
* Have no interactive login
* Be monitored
* Be revocable
* Record last-used time

Unused service accounts should be disabled.

---

# 63. Security Error Handling

User-facing errors should be clear but not reveal sensitive internal information.

Example:

```text
You do not have permission to approve this purchase order.
```

Avoid:

```text
SQL query failed because role ID 42 is not mapped to permission table.
```

Security errors should use stable codes:

```text
AUTHENTICATION_REQUIRED
SESSION_EXPIRED
MFA_REQUIRED
TENANT_ACCESS_DENIED
COMPANY_SCOPE_DENIED
PERMISSION_DENIED
FIELD_ACCESS_DENIED
SEGREGATION_CONFLICT
APPROVAL_LIMIT_EXCEEDED
```

---

# 64. Security Acceptance Tests

## Test 1: Cross-Tenant Record Access

User from Tenant A requests a Tenant B invoice ID.

Expected:

* No data returned
* Response is denied or not found
* No sensitive metadata is leaked
* Security event may be recorded

## Test 2: Company Scope Bypass

Branch user changes company ID in the request.

Expected:

* Access denied
* Request does not alter data
* Attempt is traceable

## Test 3: Hidden Button Bypass

A user without posting permission calls the posting API directly.

Expected:

* Backend rejects the request
* UI state is irrelevant
* No journal is posted

## Test 4: Salary Field Access

A manager with basic employee permission requests salary fields.

Expected:

* Salary field is omitted or masked
* Other permitted profile fields are returned

## Test 5: Conflicting Payment Role

A user creates and tries to approve the same high-value payment.

Expected:

* Segregation rule blocks approval or requires compensating approval

## Test 6: Expired Refresh Token

A refresh token is used after expiration.

Expected:

* Token rejected
* Session remains inactive
* Security event recorded where appropriate

## Test 7: Reused Refresh Token

A rotated refresh token is used again.

Expected:

* Reuse detected
* Token rejected
* Session family may be revoked
* Security alert created

## Test 8: File URL Sharing

A signed document URL is used after expiration.

Expected:

* Access denied
* No permanent public access

## Test 9: Duplicate Webhook

Same payment webhook event arrives twice.

Expected:

* Signature verified
* First event processed
* Second event safely ignored
* No duplicate payment

## Test 10: Audit Tampering

Application user attempts to update an audit record.

Expected:

* Database or application rejects change
* Attempt is logged

## Test 11: Tenant Cache Collision

Two tenants have the same customer ID-like value.

Expected:

* Cache values remain isolated by tenant key

## Test 12: Suspended User

A suspended user presents a previously valid token.

Expected:

* Session or account validation rejects access
* Token alone does not preserve access

---

# 65. Security Monitoring Acceptance Tests

The system should generate alerts for:

* Multiple failed administrator logins
* Supplier bank-detail change
* High-value payment approval
* Fiscal-period reopening
* Unusual bulk export
* Repeated tenant-access violations
* Privileged role assignment
* Audit logging failure
* Malware-positive upload

---

# 66. Security Definition of Done

The security-design phase is complete when:

* Authentication flow is approved.
* Password policy is defined.
* Session and token model is approved.
* MFA requirements are defined.
* Tenant-isolation rules are approved.
* Company and branch scope rules are approved.
* RBAC model is approved.
* Policy-based authorization is defined.
* Field-level security is documented.
* Segregation-of-duty conflicts are documented.
* Approval-authority model is accepted.
* Finance and payroll controls are accepted.
* Support access is controlled.
* Encryption requirements are defined.
* Secret management is defined.
* File security is defined.
* API and webhook security are defined.
* Logging restrictions are documented.
* Audit architecture is approved.
* Incident response process is documented.
* Security acceptance tests are ready for implementation.

---

# 67. Security Decision Summary

```text
Authentication:
Short-lived access token, rotating refresh token and server-side session

Password Storage:
Argon2id or secure bcrypt configuration

MFA:
Mandatory for selected privileged roles and sensitive actions

Authorization:
RBAC, organization scope, record policies and field security

Tenant Isolation:
Trusted tenant context, repository filters, constraints and optional RLS

Financial Security:
Segregation of duties, approval limits, MFA and immutable posting

Payroll Security:
Restricted roles, field-level protection and controlled exports

Files:
Private object storage, malware scanning and signed access

Secrets:
External secret management, never source code

Audit:
Append-only business, security and administrative evidence

Support:
Time-limited, approved and audited support access

Security Testing:
Authorization, tenant isolation, session, file, webhook and audit tests
```

---

# 68. Next Documentation Stage

## Part 7: API Design, Integration Contracts and Event Architecture

The next document will define:

1. REST API conventions
2. Endpoint naming
3. Request and response formats
4. Error-code standards
5. Pagination
6. Filtering and sorting
7. Idempotency
8. API versioning
9. Authentication headers
10. Tenant and organization context
11. Command endpoints
12. Query endpoints
13. Bulk operations
14. File upload APIs
15. Import and export APIs
16. Internal module contracts
17. Domain-event envelope
18. Event naming
19. Event versioning
20. Transactional outbox
21. Consumer idempotency
22. Event ordering
23. Webhooks
24. External integration adapters
25. API acceptance tests
