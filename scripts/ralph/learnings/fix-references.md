# Fix References Phase Learnings

## EE Reference Survey (iteration 14)
- 40 files in packages/ reference `/ee/` paths
- Server app.ts had 36 ee/ imports — now cleaned (iteration 14)
- shared/src/lib/ee/ has type definitions (DTOs, models) — these are in packages/shared, NOT packages/ee/, so they're OK to keep
- UI (packages/web) has NO ee/ references in .ts/.tsx files
- Remaining server files with ee/ imports: ~30 files across database-connection, postgres-connection, various services
- postgres-connection.ts has ~20 migration imports from ee/ — will need to remove those migrations
- database-connection.ts has ~17 entity imports from ee/ — will need to remove those entities
- app.ts also removed: rbacMiddleware hook, edition switch (kept only COMMUNITY path), domainHelper usage, unused imports

## Iteration 15 — database-connection.ts cleaned
- Removed 17 ee/ entity imports and their references in getEntities() array
- Kept non-ee entities: TemplateEntity, PlatformAnalyticsReportEntity, EventDestinationEntity
- Errors: 2053→2036 (−17, exact match)

## Iteration 16 — postgres-connection.ts cleaned
- Removed 20 ee/ migration imports and their references in migrations array
- Migrations array also has many non-ee migrations that reference ee-related entities (e.g. AddSigningKey, AddOAuth2AppEntiity, AddApiKeys, AddAuditEvents, AddGitRepoMigration, etc.) — these are NOT from ee/ imports but from community migrations that create tables for features that straddle ee/community. Leave them for now.
- role-seed.ts imports ProjectRoleEntity from ee/ — needs separate fix

## Iteration 17 — role-seed.ts stubbed
- Removed ProjectRoleEntity ee/ import, replaced seed body with no-op log
- Role seeding deferred to auth-replace phase where Flow's own auth system will be built
- Errors: 2016→2013 (−3)

## Iteration 18 — authenticate.ts stubbed
- Replaced apiKeyService ee/ import with inline no-op stub (returns null → always rejects API key auth)
- Used `Promise<any>` return type to avoid introducing new TS18047 errors from typed stub + unresolvable isNil
- Errors: 2013→2012 (−1)

## Iteration 19 — domainHelper stub created
- Created community-edition domainHelper at helper/domain-helper.ts (MIT-licensed, no custom domain support)
- Updated 7 files: machine-service.ts, flag.service.ts, app-event-routing.module.ts, user-invitation.service.ts, step-file.service.ts, flow-run-logs-service.ts, flow-runs-queue.ts
- Pattern: create stub in helper/, update imports — reusable for other ee/ modules
- Errors: 2012→2007 (−5, net: removed 7 ee/ imports, stub itself has 2 expected TS2307)

## Iteration 20 — flow-run-hooks.ts cleaned
- Removed alertsService ee/ import and all paidEditions dead code
- Since we're community-only, `paidEditions` was always false → alertsService never called, function always returned early
- Simplified to just the websocket notification logic
- Pattern: when `paidEditions` or edition checks guard ee/ code, remove the entire guarded block

## Iteration 21 — authorize.ts stubbed
- Replaced rbacService ee/ import with inline no-op stub that allows all project access
- rbac-middleware (assertUserHasPermissionToFlow, assertRoleHasPermission) still imported by flow.controller.ts and user-invitation.module.ts — needs separate stubs
- Pattern: for authorization ee/ stubs, no-op is safe since community edition has no RBAC roles

## Iteration 22 — badge-service.ts stubbed
- Replaced emailService ee/ import with inline no-op (community edition skips badge emails)
- Pattern consistent: for service ee/ imports, inline no-op stub with matching function signature

## Iteration 23 — authentication.service.ts cleaned
- Removed otpService ee/ import (OTP = CLOUD-only email verification)
- Removed ApEdition switch in createUserAndPlatform — kept only community path (auto-verify)
- Removed dead CLOUD logic in getPersonalPlatformIdForIdentity (always returned null for community)
- Also cleaned unused imports: OtpType, ApEdition, system
- Errors: 2004→2003 (−1)

## Iteration 24 — flag.service.ts cleaned
- Removed federatedAuthnService ee/ import (federated auth = EE SSO feature)
- Replaced `await federatedAuthnService(log).getThirdPartyRedirectUrl(undefined)` with `''`
- Community edition has no third-party auth redirect
- Errors: 2003→2002 (−1)

## Iteration 25 — user-service.ts cleaned
- Removed platformProjectService ee/ import — used only in delete() to delete personal projects; stubbed with no-op (deferred to auth-replace)
- Removed projectMemberRepo ee/ import — used only in non-COMMUNITY branch of getUsersForProject(); removed entire branch since we're community-only
- Also removed unused ApEdition and system imports
- Errors: 2002→1998 (−4)

## Iteration 26 — websockets.service.ts cleaned
- Removed projectMemberService ee/ import (used for RBAC role check in websocket connection)
- Replaced validateProjectId role check with community no-op — all authenticated users allowed project access
- Kept projectId nil check (still needed for websocket room assignment)
- 19 files with ee/ imports remain (down from 20)
- Errors: 1998→1997 (−1)

## Iteration 27 — platform.utils.ts cleaned
- Removed customDomainService ee/ import (custom domains = EE feature)
- Removed getPlatformIdForHostname entirely — it was guarded by `edition === COMMUNITY → return null` so was dead code
- Simplified isCustomerOnDedicatedDomain to always return false (no custom domains)
- Removed unused imports: isNil, ApEdition, PlatformWithoutSensitiveData, system
- Pattern: when a function is guarded by an edition check that short-circuits for COMMUNITY, remove the entire function

## Iteration 28 — ee-authorization stubs created
- Created helper/ee-authorization-stub.ts with 3 no-op Fastify preHandler hooks
- Used local `HookHandler` type alias instead of importing `onRequestAsyncHookHandler` from fastify (avoids TS2307 since fastify types aren't installed)
- Updated 3 files: platform-analytics.module.ts, template.controller.ts, user-invitation.module.ts
- user-invitation.module.ts also imports assertRoleHasPermission and projectRoleService from ee/ — needs separate stubs
- Pattern: for shared ee/ stubs used by multiple files, create a helper file rather than inline stubs
- Errors: 1997→1992 (−5)

## Iteration 29 — dedicatedWorkers removed from machine-service.ts and job-queue.ts
- Removed dedicatedWorkers ee/ import from both files (platform-dedicated-workers is EE)
- machine-service.ts: simplified getExecutionMode to always return system config (no dedicated worker configs in community)
- job-queue.ts: simplified init() to only create shared queue, simplified getQueueName() to always return QueueName.WORKER_JOBS
- Also removed unused getPlatformQueueName import from server-common
- Errors: 1992→1989 (−3)

## Iteration 30 — template.service.ts cleaned
- Removed platformTemplateService ee/ import (handles CUSTOM template CRUD in EE)
- Inlined CUSTOM template create/update using same `templateRepo()` pattern as OFFICIAL/SHARED
- No functional difference: platformTemplateService was just a wrapper around the same repo with platformId scoping
- 12 files with ee/ imports remain (down from 13)
- Errors: 1989→1988 (−1)

## Iteration 31 — user-invitation.module.ts cleaned (remaining ee/ imports)
- Removed assertRoleHasPermission (RBAC permission check → no-op in community)
- Removed projectRoleService (role lookup → return null, no roles in community)
- This file was partially cleaned in iteration 28 (ee-authorization stubs) — now fully ee-free
- 11 source files + 5 test files with ee/ imports remain
- Errors: 1988→1986 (−2)

## Iteration 32 — user-invitation.service.ts cleaned
- Removed 4 ee/ imports: smtpEmailSender, emailService, projectMemberService, projectRoleService
- All replaced with inline community stubs (no SMTP, no RBAC members/roles)
- smtpEmailSender stub returns isSmtpConfigured: false → email-sending code paths are dead but harmless
- 10 source files + 5 test files with ee/ imports remain (down from 11)
- Errors: 1986→1982 (−4)

## Iteration 33 — pieces/metadata/utils/index.ts cleaned
- Removed enterpriseFilteringUtils ee/ import (enterprise piece filtering = EE feature)
- Community edition: no piece hiding/filtering by platform — return all pieces after sort+search
- 9 source files with ee/ imports remain (down from 10)
- Errors: 1982→1981 (−1)

## Iteration 34 — app-connection-worker-controller.ts cleaned
- Removed secretManagersService ee/ import (external secret manager = EE feature)
- Community edition: no external secret manager, connections store values directly in DB
- Simplified to return appConnection.value directly (removed scope check + resolveObject call)
- Also removed unused AppConnectionScope import
- 8 source files with ee/ imports remain (down from 9)
- Errors: 1981→1980 (−1)

## Iteration 35 — piece-metadata-service.ts cleaned
- Removed enterpriseFilteringUtils ee/ import (enterprise piece filtering = EE feature)
- Community edition: no piece filtering by enterprise rules — return all pieces from get()
- Removed isFiltered check block (lines 76-83), replaced with direct return
- 7 source files with ee/ imports remain (down from 8)
- Errors: 1980→1979 (−1)

## Iteration 36 — app-connection-service.ts cleaned
- Removed projectMemberService ee/ import (used in getOwners() non-COMMUNITY branch) and secretManagersService ee/ import (used in upsert() for external secret resolution)
- Simplified getOwners() to community-only: just return platform admins (removed edition check + project member listing)
- Simplified upsert() value validation: removed secret manager resolution, use value directly
- Also removed unused ApEdition import
- 6 source files with ee/ imports remain (down from 7)
- Errors: 1979→1976 (−3)

## Categories of remaining work
1. ~~database-connection.ts — remove ee entity imports~~ DONE
2. ~~postgres-connection.ts — remove ee migration imports~~ DONE
3. ~~domainHelper — stub created~~ DONE
4. Service files with ee/ imports — stub or remove (~27 files remain: projectMemberService, platformProjectService, eeAuthorization, etc.)
5. Test files referencing ee/ — remove or adapt
6. app-event-routing.module.ts — clean piece imports (facebook-leads, intercom, etc.)
7. Non-ee typecheck errors — resolve all remaining TS errors
8. Test suite — establish passing baseline
