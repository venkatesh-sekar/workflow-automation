# Auth-Replace Phase Learnings

## Data Model Decisions
- Using SHA-256 hash of API key for lookup (not reversible encryption) — keys are never displayed in UI
- `apiKeyHash` column added to project entity as nullable string with unique index (filtered on non-null, non-deleted)
- Server-only field: added to local ProjectSchema type, NOT to shared Project zod schema (avoids leaking to API responses)

## Existing Auth Structure
- authentication.controller.ts: sign-up, sign-in, switch-platform endpoints (all to be replaced)
- authentication.service.ts: signUp, signInWithPassword, federatedAuthn, switchPlatform methods
- authentication-utils.ts: getProjectAndToken (reusable), assertDomainIsAllowed/assertEmailAuthIsEnabled (EE-only, removable)
- user-identity: entity + service for email/password storage (to be removed)
- access-token-manager.ts: JWT generation/verification (to be kept) — uses userIdentityService for session validation
- access-token-manager assertUserSession checks user-identity tokenVersion + verified status — needs update when identity removed
- Module prefix is `/v1/authentication` — new endpoint will be at `/v1/authentication/team-login`

## Encryption Infrastructure
- encryptUtils in helper/encryption.ts: AES-256-CBC with IV, uses ENCRYPTION_KEY env var
- For API key hashing, use crypto.createHash('sha256') directly — no need for encryption utils

## Project Members
- ProjectMember type exists in shared/ee/project-members — it ties userId to projectId via projectRoleId
- For Flow: we need simpler email-based membership (no roles, no userId requirement)
- user-invitations module also exists — may be simpler to use for email-based membership
