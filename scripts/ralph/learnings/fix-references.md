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

## Categories of remaining work
1. ~~database-connection.ts — remove ee entity imports~~ DONE
2. ~~postgres-connection.ts — remove ee migration imports~~ DONE
3. Service files with ee/ imports — stub or remove (domainHelper, projectMemberService, platformPlanService, etc.)
4. Test files referencing ee/ — remove or adapt
5. app-event-routing.module.ts — clean piece imports (facebook-leads, intercom, etc.)
6. Non-ee typecheck errors — resolve all remaining TS errors
7. Test suite — establish passing baseline
