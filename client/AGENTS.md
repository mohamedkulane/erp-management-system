# Frontend Instructions

These instructions apply to all files under client/.

## Architecture

- Use React and TypeScript.
- Use TanStack Query for server state.
- Use Zustand only for client UI state.
- Use React Hook Form and Zod for forms.
- Use shared design-system components.
- Do not duplicate backend business logic.

## Security

- UI permission checks are for user experience only.
- Never assume hidden buttons provide authorization.
- Do not store refresh tokens in localStorage.
- Do not expose restricted fields in browser state.
- Clear tenant-scoped query caches when tenant changes.

## Testing

Add tests for:

- Validation
- Permission-aware rendering
- Loading states
- Error states
- Form submission
- Tenant switching
- Accessibility