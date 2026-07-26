# Backend Instructions

These instructions apply to all files under server/.

## Architecture

Use these layers:

- API
- Application
- Domain
- Infrastructure

Controllers must not:

- Contain financial calculations
- Contain inventory calculations
- Access Prisma directly
- Decide permissions directly
- Publish unreliable events after transaction commit

## Database

- Every tenant-owned table requires tenant_id.
- Every repository query requires trusted tenant context.
- Use transactions for business commands.
- Use database constraints for critical invariants.
- Posted financial and inventory records are immutable.
- Use the transactional outbox for asynchronous events.

## Testing

Every business command requires:

- Domain or unit tests
- Repository integration tests where persistence changes
- Authorization tests
- Tenant-isolation tests
- Outbox tests where events are produced