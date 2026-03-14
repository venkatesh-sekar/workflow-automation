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

## Categories of remaining work
1. ~~database-connection.ts — remove ee entity imports~~ DONE
2. ~~postgres-connection.ts — remove ee migration imports~~ DONE
3. ~~domainHelper — stub created~~ DONE
4. Service files with ee/ imports — stub or remove (dedicatedWorkers, platformPlanService, projectMemberService, rbacService, etc.)
5. Test files referencing ee/ — remove or adapt
6. app-event-routing.module.ts — clean piece imports (facebook-leads, intercom, etc.)
7. Non-ee typecheck errors — resolve all remaining TS errors
8. Test suite — establish passing baseline
