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

## Team Login Implementation
- Endpoint: POST /v1/authentication/team-login with zod schema { email: string, apiKey: string }
- Flow: hash apiKey → findByApiKeyHash → getIdentityByEmail → getOneByIdentityAndPlatform → verify project access → generate JWT
- Still depends on user-identity for email lookup and tokenVersion — will need update when user-identity is removed
- Uses same AuthenticationResponse type as existing sign-in (includes firstName, lastName, etc from identity)
- securityAccess.public() for unauthenticated access, same rate limiting as sign-in/sign-up

## Old Auth Removal
- Removed: sign-up, sign-in, switch-platform, federated-auth endpoints from controller
- Removed: signUp, signInWithPassword, federatedAuthn, switchPlatform methods from service + all helper functions
- dev-seeds.ts was using signUp — converted to no-op (CLI scripts handle team/user creation in Flow)
- authentication-utils.ts still has extractUserIdFromRequest used by application-events.ts and flow.controller.ts — keep it
- Old auth test file (authentication.test.ts) had 4 tests for sign-up/sign-in — replaced with placeholder, will add team-login tests

## CLI Scripts
- CLI scripts live in packages/server/api/src/app/cli/ — run with `npx tsx <path>`
- create-team: creates platform (singleton), user-identity, user, and project with apiKeyHash
- Services require FastifyBaseLogger — CLI uses pino directly at warn level for quiet output
- ProjectType.TEAM (not STANDALONE), ColorName enum for icon
- API key format: `flow_<64-hex-chars>`, hashed with SHA-256 for storage
- create-team currently depends on user-identity — will need update when identity is removed
- add-member: finds project by ID, creates identity+user, inserts project_member row with default MEMBER role
- project_member table has FK to project_role — must create a default MEMBER role (all permissions) per platform
- project_member unique constraint on (projectId, userId, platformId) — script checks for existing membership
- applyProjectsAccessFilters in project-service checks project_member table for non-owner access

## User-Identity Removal Progress
- email, firstName, lastName columns added to user entity + shared User type (iteration 64)
- verified, tokenVersion columns added to user entity + shared User type (iteration 65)
- Test mock helpers (createMockUser, mockBasicUser, mockAndSaveBasicSetup, createMockPlatformWithOwner) updated to populate all fields
- DONE: access-token-manager assertUserSession now uses user.verified/tokenVersion directly (iteration 66)
- DONE: teamLogin uses getOneByPlatformAndEmail instead of identity lookup (iteration 67)
- DONE: getProjectAndToken uses user.verified/tokenVersion/email directly (iteration 67)
- DONE: AuthenticationResponse picks from User instead of UserIdentity — dropped trackEvents/newsLetter (iteration 67)
- DONE: Removed dead sendTelemetry/saveNewsLetterSubscriber from authentication-utils (iteration 67)
- tokenVersion is Nullable (string | null) on User but optional (string | undefined) on Principal — use `?? undefined` when passing
- DONE: CLI scripts (create-team, add-member) no longer create user-identities — users created directly with all fields (iteration 68)
- identityId still required by user entity (NOT NULL column) — CLI scripts use apId() placeholder; will be removed with entity column drop
- DONE: getMetaInformation uses user fields directly, imageUrl hardcoded null (iteration 69)
- DONE: getOrCreateWithProject updated to accept email/name params instead of UserIdentity (iteration 70)
- DONE: user-invitation.service.ts uses userService.getOneByPlatformAndEmail instead of userIdentityService (iteration 70)
- getUsersByIdentityId, getOneByIdentityIdOnly, getByIdentityId, getOneByIdentityAndPlatform still reference identityId in user-service
- Remaining identity refs: user-entity (identityId column), database-connection (entity registration), postgres-connection (migrations), platform.service, telemetry.utils, platform-jobs, app-connection-service, analytics module, application-events
- Next: remove identity-dependent methods from user-service (getUsersByIdentityId, getOneByIdentityIdOnly, getByIdentityId, getOneByIdentityAndPlatform), then remove identity entity/service
