# Identity and Access Module

**Status:** Ready for implementation planning  
**Module Code:** `identity`

## 1. Purpose

The Identity module manages users, authentication, sessions, credentials and tenant memberships.

## 2. Responsibilities

- User invitations
- Account activation
- Login and logout
- Password management
- Refresh-token rotation
- Session management
- MFA foundation
- Tenant membership
- User suspension and termination
- Security event logging

## 3. Core Entities

### User

- `id`
- `email`
- `username`
- `phone`
- `display_name`
- `password_hash`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

Statuses:

- `INVITED`
- `ACTIVE`
- `LOCKED`
- `SUSPENDED`
- `INACTIVE`
- `TERMINATED`

### TenantMembership

- `id`
- `tenant_id`
- `user_id`
- `status`
- `joined_at`
- `ended_at`

### Session

- `id`
- `tenant_id`
- `user_id`
- `refresh_token_hash`
- `device_name`
- `ip_address`
- `user_agent`
- `expires_at`
- `revoked_at`

### PasswordResetToken

Stores hashed single-use password reset tokens.

### MFAConfiguration

Future-ready fields:

- Method
- Secret
- Recovery codes
- Verification status

## 4. Authentication Model

- Short-lived access token
- Rotating refresh token
- Server-side session record
- Secure HttpOnly refresh-token cookie
- Access token held in memory where practical

## 5. Business Rules

- Passwords must never be stored in plaintext.
- Refresh tokens must be hashed.
- Reused rotated refresh tokens must revoke the session family.
- Suspended or terminated users cannot authenticate.
- Tenant membership must be active.
- Password reset tokens are single-use and time-limited.
- Sensitive actions may require recent MFA.
- Session revocation must take effect immediately.

## 6. Main Use Cases

- Invite user
- Activate account
- Login
- Refresh session
- Logout
- Logout all sessions
- Request password reset
- Complete password reset
- View active sessions
- Revoke session
- Suspend user
- Reactivate user
- Change password

## 7. API Endpoints

```text
POST   /api/v1/auth/invitations
POST   /api/v1/auth/activate
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/password-reset/request
POST   /api/v1/auth/password-reset/complete
GET    /api/v1/identity/sessions
DELETE /api/v1/identity/sessions/{id}
GET    /api/v1/identity/users
GET    /api/v1/identity/users/{id}
POST   /api/v1/identity/users/{id}/suspend
POST   /api/v1/identity/users/{id}/reactivate
```

## 8. Permissions

- `user.view`
- `user.invite`
- `user.suspend`
- `user.reactivate`
- `session.revoke`
- `security.manage_mfa`

## 9. Domain Events

- `UserInvited`
- `UserActivated`
- `UserLoggedIn`
- `UserLoginFailed`
- `SessionCreated`
- `SessionRevoked`
- `PasswordResetCompleted`
- `UserSuspended`
- `UserReactivated`

## 10. Testing Requirements

- Successful login
- Invalid credentials
- Suspended account
- Tenant membership validation
- Access-token expiration
- Refresh-token rotation
- Refresh-token reuse
- Session revocation
- Password reset-token reuse
- Cross-tenant user access
- Rate-limit enforcement
