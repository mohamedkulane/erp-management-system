# ENTERPRISE RESOURCE PLANNING PLATFORM

## Part 9: Infrastructure, Deployment, DevOps and Observability

**Document Status:** Initial Infrastructure and Operations Draft
**Depends On:**

* Part 1 — Product Vision and Business Scope
* Part 2 — Detailed Business Requirements
* Part 3 — System Architecture and Domain Design
* Part 4 — Database Domain Model and ERD Design
* Part 5 — Detailed Module Workflows and Accounting Impact
* Part 6 — Security, Multi-Tenancy, Access Control and Compliance Design
* Part 7 — API Design, Integration Contracts and Event Architecture
* Part 8 — Frontend Architecture, User Experience and Design System

**Architecture:** Multi-Tenant Modular Monolith
**Deployment Model:** Cloud-hosted SaaS
**Application Runtime:** Node.js
**Primary Database:** PostgreSQL
**Cache and Queue:** Redis and BullMQ
**Object Storage:** S3-compatible storage
**Containerization:** Docker
**Initial Orchestration:** Managed containers or virtual machines
**Observability:** Centralized logs, metrics, traces and alerts

---

# 1. Purpose of This Document

This document defines how the ERP platform will be built, deployed, operated, monitored and recovered.

It covers:

* Development environments
* Docker setup
* Continuous integration
* Continuous deployment
* Production topology
* Application processes
* PostgreSQL
* Redis
* Object storage
* Background jobs
* Reverse proxy
* TLS
* Secret management
* Database migrations
* Backups
* Disaster recovery
* Logging
* Metrics
* Tracing
* Health checks
* Alerting
* Security scanning
* Release and rollback strategies
* Scaling
* Operational acceptance tests

The objective is to ensure that the platform is not only correct in source code, but also reliable in real production operation.

---

# 2. Infrastructure Goals

The infrastructure should support:

1. Reliable production availability
2. Secure tenant data
3. Repeatable deployments
4. Safe database migrations
5. Horizontal application scaling
6. Background job processing
7. Centralized monitoring
8. Rapid fault detection
9. Backup and recovery
10. Environment isolation
11. Cost-conscious early deployment
12. Future enterprise growth
13. Low-friction local development
14. Controlled release management
15. Evidence for security and operational audits

---

# 3. Infrastructure Principles

## Principle 1: Infrastructure Is Reproducible

Production configuration must not depend on undocumented manual steps.

Use:

* Version-controlled configuration
* Docker images
* Environment templates
* Automated deployment pipelines
* Migration scripts
* Infrastructure documentation

---

## Principle 2: Application Instances Are Stateless

API instances must not permanently store:

* Sessions
* Uploaded files
* Generated reports
* Queue state
* User drafts
* Business data

These belong in:

* PostgreSQL
* Redis
* Object storage
* Approved external services

Stateless application instances can be replaced or scaled safely.

---

## Principle 3: Production Data Never Depends on Local Disk

Application container local disks are temporary.

Do not store production uploads in:

```text
/uploads
/public/files
/local-storage
```

inside the application server.

Use object storage instead.

---

## Principle 4: Deployments Must Be Recoverable

Every deployment must have:

* Version identifier
* Build artifact
* Migration plan
* Health checks
* Rollback or forward-fix strategy
* Deployment logs
* Responsible actor

---

## Principle 5: Failures Must Be Visible

A silent failure is an operational defect.

The system must detect and expose:

* API errors
* Slow queries
* Failed jobs
* Queue backlogs
* Database connection problems
* Storage failures
* Integration failures
* Security events
* Backup failures

---

## Principle 6: Use Managed Infrastructure Where It Reduces Risk

For a small initial team, managed services are preferred for:

* PostgreSQL
* Redis
* Object storage
* TLS
* Backups
* Monitoring where affordable

Do not introduce large operational platforms before the project needs them.

---

# 4. Environment Strategy

Required environments:

```text
Local Development
Testing
Staging
Production
```

Optional future environments:

```text
Preview
Training
Disaster Recovery
Performance Testing
```

---

# 5. Local Development Environment

Local development should use Docker Compose.

Recommended services:

```text
Docker Compose
├── PostgreSQL
├── Redis
├── MinIO
├── Mail Testing Server
├── ERP API
├── Background Worker
├── Scheduler
└── Frontend
```

Optional tools:

* pgAdmin
* Redis Commander
* BullMQ dashboard
* OpenTelemetry collector
* Local log viewer

---

# 6. Local Development Goals

A new developer should be able to:

1. Clone the repository.
2. Copy an example environment file.
3. Run one setup command.
4. Start the system.
5. Apply migrations.
6. Load seed data.
7. Log in with a development account.
8. Execute a complete business flow.

Example commands:

```text
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

The exact commands should be standardized in the repository.

---

# 7. Environment Configuration

Use environment variables for deploy-time configuration.

Examples:

```text
NODE_ENV
APP_PORT
DATABASE_URL
REDIS_URL
JWT_SIGNING_KEY
OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_BUCKET
OBJECT_STORAGE_ACCESS_KEY
OBJECT_STORAGE_SECRET_KEY
SMTP_HOST
SMTP_USER
SMTP_PASSWORD
```

Requirements:

* Provide `.env.example`
* Never commit real secrets
* Validate required variables at startup
* Fail fast on invalid production configuration
* Use separate values per environment

---

# 8. Configuration Categories

Configuration should be divided into:

## Application Configuration

* Port
* Public URL
* Timeouts
* Feature flags

## Database Configuration

* Connection string
* Pool limits
* Migration options

## Security Configuration

* Token expiry
* Signing keys
* Cookie settings
* Encryption keys

## Storage Configuration

* Bucket
* Provider
* Endpoint
* Signed URL lifetime

## Integration Configuration

* Email
* SMS
* Mobile money
* External webhooks

Tenant-specific configuration belongs in the application database, not in global environment variables.

---

# 9. Repository Strategy

Recommended initial repository model:

```text
erp-platform/
├── client/
├── server/
├── infrastructure/
├── docs/
├── scripts/
├── docker-compose.yml
├── package.json
└── README.md
```

A monorepo is recommended because:

* Frontend and backend versions remain coordinated.
* Shared API contracts can be managed safely.
* CI/CD setup is simpler.
* Documentation stays close to implementation.
* One team is initially responsible for the product.

---

# 10. Monorepo Tooling

Possible tooling:

* npm workspaces
* pnpm workspaces
* Turborepo
* Nx

Recommended initial option:

```text
pnpm workspaces
```

or a simple npm workspace if the team is more comfortable with npm.

Avoid complex monorepo tooling unless it produces clear benefits.

---

# 11. Docker Architecture

Primary containers:

```text
erp-web
erp-api
erp-worker
erp-scheduler
```

Infrastructure dependencies:

```text
postgres
redis
object-storage
```

Optional operational containers:

```text
otel-collector
prometheus
grafana
loki
```

---

# 12. API Container

Responsibilities:

* REST APIs
* Authentication
* Business commands
* Queries
* WebSocket connections
* Health checks

The API container should not process heavy reports or imports synchronously.

---

# 13. Worker Container

Responsibilities:

* Outbox events
* Notifications
* Imports
* Exports
* PDF generation
* Excel generation
* Webhook delivery
* Search projections
* Background financial checks

The worker may run the same codebase with a different startup entry point.

Example:

```text
node dist/main-api.js
node dist/main-worker.js
```

---

# 14. Scheduler Container

Responsibilities:

* Recurring jobs
* Invoice overdue checks
* Stock expiry alerts
* Reorder checks
* Scheduled reports
* Cleanup tasks
* Exchange-rate retrieval
* Session cleanup
* Retention jobs

Only one scheduler instance should execute each scheduled task.

Use:

* Distributed lock
* Unique scheduled job
* Leader election
* Queue-based scheduler

---

# 15. Frontend Deployment

The React frontend should be built into static assets.

Deployment options:

* CDN-backed static hosting
* Managed frontend hosting
* Nginx
* Object storage with CDN

The frontend configuration should include:

* API base URL
* WebSocket URL
* Environment name
* Public feature flags

Secrets must never be placed in frontend environment variables.

---

# 16. Initial Production Topology

Recommended early production topology:

```text
Users
  ↓
DNS
  ↓
CDN / WAF
  ↓
Load Balancer or Reverse Proxy
  ├── Frontend Static Assets
  └── ERP API Instances
          ↓
   ┌────────────────────────────┐
   │ Managed PostgreSQL        │
   │ Managed Redis             │
   │ Object Storage            │
   │ Worker Instances          │
   │ Scheduler Instance        │
   │ Monitoring and Logging    │
   └────────────────────────────┘
```

---

# 17. Cost-Conscious Deployment Stages

## Stage 1: Development and Demonstration

Suitable for portfolio and early testing.

```text
One application server
Managed PostgreSQL
Managed Redis or small Redis instance
Object storage
One worker
```

## Stage 2: Early SaaS Production

```text
Two API instances
Separate worker
Managed PostgreSQL with backups
Managed Redis
CDN
Centralized logs
Health monitoring
```

## Stage 3: Growth

```text
Multiple API instances
Multiple queue-specific workers
Database read replica
Dedicated monitoring
WAF
Automated scaling
Improved disaster recovery
```

## Stage 4: Enterprise

```text
Multi-region options
Dedicated tenant deployment options
Advanced network isolation
Higher recovery targets
Private connectivity
Formal compliance controls
```

---

# 18. Reverse Proxy

Nginx, a managed load balancer or an equivalent reverse proxy should handle:

* TLS termination
* Request forwarding
* Compression
* Request-size limits
* Timeouts
* Security headers
* Static frontend files where applicable
* WebSocket upgrade
* Basic rate limiting

Business authorization must not exist only in Nginx.

---

# 19. DNS Strategy

Suggested domains:

```text
app.example.com
api.example.com
files.example.com
status.example.com
```

Optional tenant branding:

```text
tenantname.example.com
```

or custom domains in future enterprise plans.

DNS changes should be managed and documented.

---

# 20. TLS and HTTPS

Production must use HTTPS.

Requirements:

* Valid certificate
* Automatic renewal
* Redirect HTTP to HTTPS
* Modern TLS configuration
* Secure cookies
* HSTS after verification
* HTTPS for APIs and WebSockets

Internal database and Redis traffic should use TLS where supported and required.

---

# 21. Content Delivery Network

A CDN may serve:

* Frontend assets
* Public images
* Public documentation
* Public marketing content

Private ERP files should not become permanently public through the CDN.

Use signed URLs or authenticated download flows.

---

# 22. Web Application Firewall

A WAF may provide:

* Common attack filtering
* IP reputation controls
* Rate limiting
* Bot filtering
* Geographic restrictions
* DDoS assistance

The WAF supplements application security.

It does not replace:

* Validation
* Authentication
* Authorization
* Safe SQL handling

---

# 23. PostgreSQL Deployment

Production PostgreSQL should preferably be managed.

Required features:

* Automated backups
* Point-in-time recovery
* Monitoring
* Encryption
* Connection security
* Maintenance automation
* High availability where affordable
* Read replicas when justified

---

# 24. Database Connection Pooling

Application instances must use controlled connection pools.

Do not allow every request to create a new database connection.

Possible components:

* ORM connection pool
* PgBouncer
* Managed provider pooling

Pool sizing must consider:

```text
API Instances
× Connections Per Instance
+
Workers
+
Scheduler
+
Reporting
```

The total must remain below database limits.

---

# 25. Database Connection Safety

Connections must set and reset:

* Tenant context
* Transaction state
* Timeouts
* Search path where used

When using Row-Level Security:

```text
SET LOCAL app.current_tenant_id = '<trusted-id>';
```

This should occur inside a transaction.

Connection pooling must not leak tenant context between requests.

---

# 26. Database Timeouts

Recommended controls:

* Connection timeout
* Statement timeout
* Lock timeout
* Idle transaction timeout

Long reports should not block operational transactions.

Use asynchronous reporting where required.

---

# 27. Database Index Monitoring

Monitor:

* Slow queries
* Sequential scans
* Missing indexes
* Unused indexes
* Index bloat
* Lock waits
* Connection saturation

Index changes should be based on real query patterns.

---

# 28. Database Migration Pipeline

Recommended deployment order:

```text
Build Application
→ Run Tests
→ Backup Readiness Check
→ Apply Backward-Compatible Migration
→ Deploy Application
→ Verify Health
→ Run Deferred Data Migration
```

For breaking schema changes, use expand-and-contract.

---

# 29. Expand-and-Contract Migration

Example column replacement:

## Expand

* Add new column
* Keep old column
* Write both columns
* Backfill new column

## Migrate

* Verify all rows
* Update readers to new column

## Contract

* Stop using old column
* Remove old column in later release

This reduces deployment downtime and rollback risk.

---

# 30. Migration Rules

Production migrations must:

* Be version controlled
* Be reviewed
* Avoid uncontrolled destructive changes
* Have recovery guidance
* Be tested with realistic data
* Avoid long table locks
* Be observable
* Be executed once

Large indexes may use concurrent creation where supported.

---

# 31. Seed Data

System seed data includes:

* Permissions
* Standard roles
* Module codes
* Currencies
* Account types
* Workflow states
* Event types
* Notification types

Business demonstration data should be separate from production seed data.

---

# 32. Redis Deployment

Redis supports:

* BullMQ
* Sessions where needed
* Caching
* Rate limiting
* Distributed locks
* WebSocket scaling

Production Redis should have:

* Authentication
* Private networking
* TLS where supported
* Memory limits
* Monitoring
* Persistence appropriate to queue requirements
* Backup or replication where justified

---

# 33. Redis Memory Policy

Queue data must not be unexpectedly removed by cache eviction.

If one Redis instance hosts cache and jobs, configure carefully.

Recommended longer-term separation:

```text
Redis for Queues
Redis for Cache
```

This separation becomes useful as the platform grows.

---

# 34. Queue Architecture

Suggested queues:

```text
outbox-events
notifications
emails
documents
imports
exports
reports
integrations
maintenance
```

Each queue should define:

* Concurrency
* Retry policy
* Timeout
* Backoff
* Dead-letter behaviour
* Retention
* Alert threshold

---

# 35. Queue Priority

Possible priority levels:

```text
CRITICAL
HIGH
NORMAL
LOW
```

Examples:

* Security notification: high
* Payment callback: high
* Invoice PDF generation: normal
* Monthly report: low

Priority should not allow one tenant to starve all others indefinitely.

---

# 36. Worker Isolation

Separate workers may be used for resource-heavy jobs.

Example:

```text
notification-worker
import-worker
report-worker
integration-worker
```

Benefits:

* Independent scaling
* Fault isolation
* Resource control
* Easier monitoring

The initial deployment may use one worker process until workload requires separation.

---

# 37. Dead-Letter Handling

Jobs move to dead-letter status when retry limits are exceeded.

Dead-letter records should display:

* Queue
* Job ID
* Tenant
* Job type
* Last error
* Attempt count
* Creation time
* Correlation ID

Authorized operators should be able to:

* Inspect
* Retry
* Mark resolved
* Cancel
* Escalate

---

# 38. Object Storage

Use S3-compatible storage.

Examples:

* Cloudflare R2
* AWS S3
* MinIO
* Managed compatible provider

Storage categories:

```text
documents
imports
exports
reports
tenant-branding
temporary
```

---

# 39. Object Storage Buckets

Possible strategy:

```text
erp-private
erp-public
erp-backups
```

or separate buckets per environment.

Production and non-production must not share the same buckets.

---

# 40. Object Lifecycle Policies

Examples:

* Temporary upload: delete after 24 hours if not completed
* Export file: delete after 7 days
* Import result: delete after 30 days
* Financial document: retain according to tenant policy
* Malware quarantine: restricted retention
* Old file versions: archive according to policy

---

# 41. File Replication and Durability

Use storage with appropriate durability and versioning.

Important files may require:

* Versioning
* Cross-region replication
* Retention lock
* Backup copy

These may become enterprise-tier features.

---

# 42. Secret Management

Production secrets should be stored in:

* Cloud secret manager
* Managed environment-secret service
* Vault-like system

Secrets must be:

* Encrypted
* Access controlled
* Audited
* Rotatable
* Environment specific

---

# 43. Secret Rotation

Rotation plans are required for:

* Database passwords
* Redis passwords
* JWT keys
* Encryption keys
* Object-storage keys
* Email credentials
* Payment-provider secrets
* Webhook secrets

Key rotation should support overlap where necessary.

Example:

```text
Current Signing Key
Previous Signing Key
```

This allows existing short-lived tokens to expire safely.

---

# 44. Continuous Integration Pipeline

Every pull request should run:

1. Install dependencies
2. Type check
3. Lint
4. Unit tests
5. Integration tests
6. Build frontend
7. Build backend
8. Security scans
9. Migration validation
10. Artifact generation

Example pipeline:

```text
Pull Request
→ Quality Checks
→ Automated Tests
→ Security Checks
→ Build
→ Review
```

---

# 45. Continuous Deployment Pipeline

Staging deployment:

```text
Merge to Main
→ Build Versioned Images
→ Push Registry
→ Apply Staging Migrations
→ Deploy Staging
→ Run Smoke Tests
→ Mark Release Candidate
```

Production deployment:

```text
Approved Release
→ Pre-Deployment Checks
→ Apply Safe Migrations
→ Deploy
→ Health Verification
→ Smoke Tests
→ Monitor
```

---

# 46. Container Image Standards

Images should:

* Use minimal base images
* Pin important versions
* Run as non-root
* Exclude development dependencies where possible
* Include health checks
* Include build metadata
* Be scanned
* Avoid secrets

Use multi-stage builds.

---

# 47. Build Versioning

Every release should have a version.

Examples:

```text
v0.1.0
v0.2.0
v1.0.0
```

Build metadata should include:

* Git commit
* Build date
* Version
* Environment
* Image digest

An operational endpoint may expose safe build information.

---

# 48. Release Strategy

Recommended initial strategy:

```text
Rolling deployment
```

Later options:

* Blue-green deployment
* Canary deployment
* Feature-flag rollout

For database-heavy changes, deployment strategy must coordinate with migration compatibility.

---

# 49. Rolling Deployment

During rolling deployment:

* Old and new application versions may run simultaneously.
* API contracts and database schema must remain compatible.
* Background workers must tolerate event-version overlap.
* Session handling must remain stable.

This reinforces the need for backward-compatible migrations.

---

# 50. Blue-Green Deployment

Future enterprise deployment:

```text
Blue Environment: Current
Green Environment: New
```

After validation, traffic moves to Green.

Benefits:

* Faster rollback
* Reduced downtime

Risks:

* Database compatibility
* Increased infrastructure cost
* Queue worker duplication

---

# 51. Feature Flags

Feature flags can control:

* New module visibility
* New workflow
* New report
* Tenant beta access
* Gradual rollout

Flags must not replace access permissions.

Lifecycle:

```text
Created
→ Enabled for Test
→ Enabled for Selected Tenants
→ Enabled Globally
→ Removed from Code
```

Old flags should not accumulate permanently.

---

# 52. Rollback Strategy

Application rollback is possible when:

* Database remains backward compatible
* Event schemas remain supported
* No irreversible business migration occurred

Rollback plan must distinguish:

* Application rollback
* Configuration rollback
* Database restore
* Data correction
* Forward fix

A production database should not be casually restored to roll back one application defect because valid business transactions may be lost.

---

# 53. Forward-Fix Strategy

For many production defects, the safer response is:

1. Stop harmful action
2. Disable feature
3. Deploy correction
4. Run controlled data repair
5. Audit correction
6. Add regression test

This is often safer than restoring the entire database.

---

# 54. Health Checks

Required health endpoints:

```text
/health/live
/health/ready
```

## Liveness

Confirms the process is running.

It should not fail because one optional integration is unavailable.

## Readiness

Confirms the instance can safely receive traffic.

It may check:

* Database
* Redis
* Required configuration
* Critical internal readiness

---

# 55. Dependency Health

Expose internal dependency status to authorized operations tools.

Examples:

```text
PostgreSQL: Healthy
Redis: Healthy
Object Storage: Healthy
Email Provider: Degraded
Mobile Money: Healthy
```

Public health endpoints should not expose sensitive infrastructure details.

---

# 56. Startup and Shutdown

## Startup

Application should:

1. Validate configuration
2. Connect to required dependencies
3. Confirm migration compatibility
4. Start health server
5. Begin accepting traffic

## Graceful Shutdown

Application should:

1. Stop accepting new traffic
2. Finish current requests within timeout
3. Stop polling new jobs
4. Complete or safely release current jobs
5. Close connections
6. Exit cleanly

---

# 57. Logging Architecture

Use structured JSON logs in production.

Example:

```json
{
  "timestamp": "2026-07-25T15:30:00Z",
  "level": "info",
  "service": "erp-api",
  "module": "sales",
  "event": "sales_order_confirmed",
  "tenantId": "tenant_001",
  "userId": "user_100",
  "correlationId": "corr_123",
  "salesOrderId": "so_500",
  "durationMs": 145
}
```

---

# 58. Log Levels

```text
TRACE
DEBUG
INFO
WARN
ERROR
FATAL
```

Production defaults should avoid excessive debug logging.

## INFO

* Successful important operation
* Service startup
* Deployment version

## WARN

* Recoverable problem
* Retry scheduled
* Slow query
* Business configuration issue

## ERROR

* Failed operation
* Unhandled provider error
* Dead-letter job

## FATAL

* Process cannot safely continue
* Critical configuration failure

---

# 59. Sensitive Logging Rules

Never log:

* Passwords
* Access tokens
* Refresh tokens
* MFA secrets
* Full bank account numbers
* Full payment credentials
* Encryption keys
* Restricted payroll details
* Uploaded document contents

Mask or omit sensitive values.

---

# 60. Centralized Logging

Logs from all application processes should be sent to one searchable platform.

Possible options:

* Cloud logging provider
* Loki
* Elasticsearch/OpenSearch
* Managed observability platform

Operators should search using:

* Correlation ID
* Tenant ID
* User ID
* Module
* Record ID
* Error code
* Job ID

---

# 61. Audit Logs vs Operational Logs

Operational logs help debug systems.

Audit logs preserve accountable business evidence.

They are not interchangeable.

```text
Operational Log:
Database query timed out

Audit Log:
User approved payment PAY-2026-0050
```

Audit logs must remain in the application’s controlled append-only audit store.

---

# 62. Metrics Architecture

Track application metrics such as:

* Request count
* Error count
* Response time
* Active users
* Database connections
* Queue depth
* Job failure count
* Cache hit rate
* Webhook success rate
* Integration latency
* Outbox backlog
* Notification delivery rate

---

# 63. Business Metrics

Operational monitoring may also include safe business process metrics:

* Orders awaiting reservation
* Deliveries pending posting
* Invoices pending approval
* Payments pending allocation
* Failed stock postings
* Unmatched supplier invoices
* Overdue approval tasks

These help detect business process failures before users report them.

---

# 64. Metric Labels

Use low-cardinality labels.

Good labels:

```text
service
module
endpoint
status_code
job_type
environment
```

Avoid high-cardinality labels such as:

```text
customer_id
sales_order_id
invoice_number
```

These belong in logs or traces, not metric labels.

---

# 65. Distributed Tracing

Tracing should show the lifecycle of a request.

Example:

```text
HTTP Confirm Sales Order
├── Authentication
├── Authorization
├── Load Sales Order
├── Credit Check
├── Reserve Inventory
├── Save Transaction
├── Insert Audit Event
└── Insert Outbox Event
```

Tracing is especially useful for:

* Slow business commands
* Background jobs
* Integration calls
* Event processing
* Database waits

---

# 66. Trace Context

Use:

* Trace ID
* Span ID
* Correlation ID
* Tenant ID as controlled metadata
* Module
* Operation

Avoid placing sensitive values into trace attributes.

---

# 67. OpenTelemetry Direction

OpenTelemetry may provide:

* Traces
* Metrics
* Log correlation
* Vendor-neutral instrumentation

Recommended future flow:

```text
ERP Processes
→ OpenTelemetry Collector
→ Monitoring Backend
```

Initial implementation may start with structured logs and basic metrics, then add full tracing.

---

# 68. Alerting Architecture

Alerts should be actionable.

Every alert should answer:

* What failed?
* Which environment?
* How severe is it?
* Which system is affected?
* What should the operator check?
* Is there a runbook?

Avoid alerts for every minor transient error.

---

# 69. Alert Severity

```text
INFO
WARNING
HIGH
CRITICAL
```

## Warning

* Queue depth increasing
* Slow API
* Backup delayed
* Provider degraded

## High

* Repeated job failures
* Database connection saturation
* High error rate
* Outbox backlog

## Critical

* Database unavailable
* Confirmed data loss risk
* Tenant isolation incident
* Backup failure beyond threshold
* Audit logging unavailable
* Payment duplication risk

---

# 70. Suggested Alerts

* API error rate above threshold
* P95 latency above threshold
* Database CPU high
* Database storage low
* Connection pool exhausted
* Redis unavailable
* Queue backlog too large
* Dead-letter jobs created
* Outbox events delayed
* Backup failed
* Object storage unavailable
* Webhook failure spike
* Suspicious authentication spike
* Audit writer failure

---

# 71. Runbooks

Each critical alert should link to a runbook.

Example runbook sections:

```text
Alert Meaning
Possible Causes
Immediate Checks
Containment
Recovery Steps
Escalation
Verification
Post-Incident Tasks
```

Runbooks should be stored in version-controlled documentation.

---

# 72. Uptime Targets

Initial service objective example:

```text
Monthly availability target: 99.5%
```

Later production target:

```text
99.9% or higher
```

A target should be realistic for the infrastructure budget and team maturity.

---

# 73. Service-Level Indicators

Possible indicators:

* Successful authenticated API request rate
* API latency
* Background-job completion time
* Payment callback success
* Report completion rate
* Database availability
* Object-storage availability

---

# 74. Performance Monitoring

Track:

* P50 latency
* P95 latency
* P99 latency
* Slow queries
* Long transactions
* Queue processing duration
* Report duration
* Import processing rate
* Frontend load performance

---

# 75. Capacity Planning

Monitor trends in:

* Tenant count
* User count
* Transactions per day
* Journal lines
* Stock movements
* File storage
* Database size
* Redis memory
* Queue volume
* API throughput

Capacity planning should occur before resources reach critical levels.

---

# 76. Horizontal Scaling

API instances may scale horizontally because they are stateless.

Scaling triggers may include:

* CPU
* Memory
* Request rate
* Latency
* Concurrent connections

WebSocket scaling may require Redis adapter or equivalent coordination.

---

# 77. Worker Scaling

Workers should scale by:

* Queue depth
* Oldest pending job
* Job processing duration
* CPU or memory
* Provider rate limits

Example:

```text
Export queue high
→ Increase export workers
```

---

# 78. Database Scaling

Order of optimization:

1. Fix incorrect queries
2. Add correct indexes
3. Improve connection pooling
4. Reduce unnecessary queries
5. Add read models
6. Add read replica
7. Partition high-volume tables
8. Scale database resources

Do not jump directly to sharding.

---

# 79. Read Replicas

Read replicas may support:

* Heavy reports
* Historical queries
* Audit searches
* Analytics projections

Do not use asynchronous replicas for operations requiring immediately consistent financial or inventory data.

---

# 80. Caching Strategy

Cache candidates:

* Tenant settings
* Currency definitions
* Permission summaries
* Product reference data
* Price lists
* Dashboard projections

Avoid caching highly volatile critical values without careful invalidation.

Examples:

* Available stock
* Approval status
* Payment status
* Customer credit exposure

These may use short-lived or specialized read models.

---

# 81. Cache Invalidation

Invalidate cache after relevant events.

Examples:

```text
ProductUpdated
→ Invalidate product cache

PermissionChanged
→ Invalidate user authorization cache

PriceListUpdated
→ Invalidate pricing cache
```

Cache failure must not corrupt source data.

---

# 82. Backup Strategy

Required backups:

* PostgreSQL backups
* Point-in-time recovery logs
* Object-storage versioning or backups
* Configuration backup
* Secret recovery process
* Infrastructure configuration backup

Redis backup requirements depend on queue durability and architecture.

---

# 83. Database Backup Schedule

Example initial policy:

```text
Automated daily full backup
Continuous point-in-time recovery
Retention: 30 days
Monthly archival backup
```

Final retention depends on business and regulatory requirements.

---

# 84. Backup Verification

A backup is not trusted until restore testing succeeds.

Regularly test:

* Full database restore
* Point-in-time restore
* Object-file recovery
* Configuration recovery
* Application connection to restored environment

Record:

* Restore date
* Duration
* Issues
* Recovery point
* Responsible operator

---

# 85. Recovery Objectives

Initial target:

```text
Recovery Point Objective: 15 minutes
Recovery Time Objective: 4 hours
```

Meaning:

* RPO: up to 15 minutes of recent data may be at risk in a major disaster.
* RTO: service recovery target is within 4 hours.

Enterprise tiers may require stronger targets.

---

# 86. Disaster Recovery Strategy

Potential disaster scenarios:

* Database corruption
* Region outage
* Storage failure
* Secret compromise
* Accidental deletion
* Bad migration
* Application deployment failure
* Security incident

Recovery planning should define:

* Detection
* Decision authority
* Recovery environment
* Backup selection
* Data validation
* Communication
* Return to normal operation

---

# 87. Disaster Recovery Stages

```text
Incident Declared
→ Containment
→ Recovery Environment Prepared
→ Data Restored
→ Application Deployed
→ Integrity Checks
→ Limited Access
→ Full Access
→ Post-Recovery Review
```

---

# 88. Data Integrity Checks After Recovery

Verify:

* Journal entries remain balanced
* Stock balances reconcile to movements
* Payment allocations reconcile
* Tenant counts are correct
* Outbox state is valid
* Background jobs are not duplicated
* Files remain linked
* Audit logs are available

---

# 89. Financial Integrity Verification Script

The platform should include operational scripts such as:

```text
verify-ledger-balances
verify-unbalanced-journals
verify-receivable-balances
verify-payable-balances
```

These scripts should be read-only by default.

---

# 90. Inventory Integrity Verification Script

Examples:

```text
verify-stock-balances
verify-negative-stock
verify-serial-number-uniqueness
verify-reservation-totals
verify-valuation-layers
```

These checks are useful after:

* Migration
* Restore
* Data import
* Major release
* Incident recovery

---

# 91. Security Scanning

CI/CD should include:

* Dependency vulnerability scan
* Secret scan
* Container image scan
* Static code security scan
* License check
* Infrastructure configuration scan where applicable

High-severity findings require review before deployment.

---

# 92. Dependency Management

Use:

* Lockfiles
* Automated dependency updates
* Version review
* Test execution after upgrades
* Security advisories
* Controlled major upgrades

Avoid automatic uncontrolled production upgrades.

---

# 93. Production Access Control

Production access should use:

* Individual accounts
* MFA
* Least privilege
* No shared administrator passwords
* Time-limited elevated access
* Audit logs
* Approved network access

Direct database access should be restricted.

---

# 94. Database Administration Access

Administrative database access should require:

* Approved purpose
* MFA
* Restricted account
* Read-only by default
* Time limit
* Audit
* Query caution
* No direct production data editing except controlled incident procedures

Business corrections should normally use application workflows or controlled scripts.

---

# 95. Operational Data Repair

A repair process should include:

1. Identify affected records.
2. Stop further damage.
3. Back up affected data.
4. Prepare reviewed repair script.
5. Test in staging copy.
6. Obtain approval.
7. Execute with transaction controls.
8. Verify results.
9. Record audit evidence.
10. Add a permanent code fix.

---

# 96. Status Page

A public or tenant-facing status page may show:

* API availability
* Web application availability
* File service status
* Notification delays
* Scheduled maintenance
* Incident history

Do not expose sensitive internal infrastructure.

---

# 97. Maintenance Windows

Planned maintenance should include:

* Start and end time
* Affected features
* Expected user impact
* Rollback plan
* Tenant notification
* Completion notice

The system should minimize downtime through backward-compatible deployments.

---

# 98. Deployment Notifications

Relevant teams should receive:

* Deployment started
* Deployment succeeded
* Deployment failed
* Migration failed
* Rollback started
* Rollback completed

Production deployment notifications should include version and environment.

---

# 99. Infrastructure Acceptance Tests

## Test 1: New Environment Setup

Expected:

* Environment created from documented configuration
* Application starts
* Migrations run
* Health checks pass

## Test 2: API Instance Failure

One API instance stops.

Expected:

* Load balancer removes it
* Other instances continue serving traffic

## Test 3: Worker Restart

Worker stops during retryable job.

Expected:

* Job returns to queue or safely resumes
* No duplicate business effect

## Test 4: Redis Failure

Expected:

* API reports degraded dependencies where appropriate
* Financial database data remains safe
* Jobs recover after Redis restoration
* Failure alert generated

## Test 5: Object Storage Failure

Expected:

* Business transactions not requiring files may continue
* Uploads fail clearly
* Retry is possible
* Alert generated

---

# 100. Database Acceptance Tests

## Test 1: Migration Deployment

Expected:

* Migration succeeds in staging
* Application remains compatible
* Production deployment health passes

## Test 2: Connection Pool Saturation

Expected:

* Requests fail gracefully or queue within limits
* Alert generated
* Database is not overwhelmed by unlimited connections

## Test 3: Slow Query

Expected:

* Query appears in monitoring
* Correlation information available
* Performance review possible

## Test 4: Tenant Context Reset

Expected:

* Connection reused by another request does not retain previous tenant context

---

# 101. Backup and Recovery Acceptance Tests

## Test 1: Full Restore

Expected:

* Database restored into isolated environment
* Application starts
* Integrity scripts pass

## Test 2: Point-in-Time Restore

Expected:

* Restore reaches selected time
* Recent expected records exist
* Later records do not exist

## Test 3: File Recovery

Expected:

* Selected document version is recovered
* Database link remains valid

## Test 4: Recovery Timing

Expected:

* Recovery completes within documented target during formal exercise

---

# 102. Observability Acceptance Tests

## Test 1: Correlation ID

A sales-order confirmation is executed.

Expected:

* Same correlation ID appears in API, audit, outbox and job logs

## Test 2: Failed Job

Expected:

* Retry occurs
* Failure visible
* Dead-letter alert generated after threshold

## Test 3: High Error Rate

Expected:

* Alert generated
* Dashboard shows affected endpoint

## Test 4: Audit Writer Failure

Expected:

* Sensitive business action fails safely or triggers critical incident according to policy

---

# 103. Deployment Definition of Done

A production release is complete when:

* CI pipeline passes.
* Security scans pass or findings are approved.
* Versioned images are built.
* Database migration is reviewed.
* Backup readiness is confirmed.
* Deployment completes.
* Health checks pass.
* Smoke tests pass.
* Business-critical flows are verified.
* Monitoring shows normal behaviour.
* Deployment record is stored.
* Rollback readiness is confirmed.
* Release notes are published.

---

# 104. Infrastructure Definition of Done

The infrastructure-design phase is complete when:

* Environment strategy is approved.
* Docker architecture is defined.
* Repository strategy is accepted.
* Production topology is documented.
* PostgreSQL deployment is defined.
* Redis and queue design are defined.
* Object-storage design is defined.
* Secret management is defined.
* CI/CD pipelines are documented.
* Migration deployment is defined.
* Release and rollback strategies are accepted.
* Logging, metrics and tracing are defined.
* Health checks and alerting are defined.
* Backup and recovery requirements are accepted.
* Scaling strategy is documented.
* Infrastructure acceptance tests are ready.

---

# 105. Infrastructure Decision Summary

```text
Repository:
Monorepo

Containers:
Frontend, API, worker and scheduler

Local Development:
Docker Compose

Production:
Managed cloud services and stateless application instances

Database:
Managed PostgreSQL with backups and PITR

Cache and Queues:
Redis and BullMQ

Files:
Private S3-compatible object storage

Deployment:
Versioned Docker images through CI/CD

Migration:
Backward-compatible expand-and-contract strategy

Observability:
Structured logs, metrics, tracing and alerts

Recovery:
Encrypted backups, restore testing and integrity checks

Scaling:
Horizontal API and worker scaling before complex architecture changes
```

---

# 106. Next Documentation Stage

## Part 10: Testing Strategy, Quality Assurance and Release Validation

The next document will define:

1. Testing philosophy
2. Testing pyramid
3. Unit testing
4. Domain-rule testing
5. Integration testing
6. Repository testing
7. API testing
8. Contract testing
9. Event testing
10. End-to-end testing
11. Tenant-isolation testing
12. Authorization testing
13. Accounting testing
14. Inventory testing
15. Workflow testing
16. Import and export testing
17. Security testing
18. Performance testing
19. Reliability testing
20. Disaster-recovery testing
21. Test data strategy
22. Test environments
23. Defect management
24. Release gates
25. User acceptance testing
26. Definition of Done
