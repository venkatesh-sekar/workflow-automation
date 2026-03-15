# Global Learnings

Cross-phase insights that affect future work. Max ~50 lines — consolidate when growing beyond.

## Build System
- Activepieces uses turbo + bun; we use npm — `workspace:*` protocol unsupported, need explicit versioning
- Use `file:` protocol for local deps (e.g., `"@activepieces/shared": "file:../../shared"`)
- Must build upstream packages (`tsc -p tsconfig.lib.json`) to produce dist/ for downstream type resolution
- When two file:-linked packages share a dep, child should use peerDependencies to avoid TS type duplication (typeorm lesson)
- tsconfig paths work for typecheck but NOT for vitest runtime — must also add resolve.alias in vitest.config.ts

## Package Structure
- Shared packages copied: shared, pieces-framework, pieces-common, server-common, engine
- UI (packages/web) depends on: shared, pieces-framework, pieces-common
- Server/api depends on: shared, pieces-framework, pieces-common, server-common, engine
- Worker package NOT copied — stubbed via helper/worker-stub.ts + tsconfig paths mapping
- 21 piece directories: 19 core + 2 community (slack, postgres); Code/Branches/Loops are built-in FlowActionTypes

## EE Exclusion (complete)
- All ee/ imports removed from server source (30 files), test files (3 files), and vite.config.mts
- shared/src/lib/ee/ contains type definitions (DTOs, models) — these are in packages/shared, NOT packages/ee/, safe to keep
- UI has 3 files importing `ee-embed-sdk` module (embed routes = EE feature) — module doesn't exist, dead code

## Test Infrastructure
- Tests use vitest (not jest) — config at packages/server/api/vitest.config.ts
- Integration tests need postgres (pg-mem) + redis (redis-memory-server with MALLOC=libc patch)
- dayjs plugins must be registered in vitest.setup.ts (Vite SSR isolation prevents side-effect loading)
- reflect-metadata required at runtime (typeorm)
- Test baseline: 21 suites, 171 tests, all passing

## Auth System (complete)
- Team-login only: POST /v1/authentication/team-login with {email, apiKey}
- user-identity entity fully removed — user entity has email/firstName/lastName/verified/tokenVersion directly
- CLI scripts in packages/server/api/src/app/cli/: create-team, add-member, rotate-key
- API key format: `flow_<64-hex>`, stored as SHA-256 hash in project.apiKeyHash
- project_member + project_role tables exist via migrations (EE entities removed) — used for membership checks

## Env Vars (complete)
- All env vars use FLOW_ prefix (was AP_). Prefix applied at read time in system-props.ts and env-migrations.ts
- Enum values (e.g. ENCRYPTION_KEY) don't have the prefix — prefix added dynamically

## AI Providers (complete)
- Stripped to OpenAI only — 6 provider files deleted, shared types trimmed, UI cleaned
- Migration files keep removed enum values as string literals with `as any` — don't touch
- ACTIVEPIECES cloud-credits proxy removed entirely; aiCreditsEnabled hardcoded false

## Audit Logs (complete)
- Custom audit_event entity/service/module at packages/server/api/src/app/audit-event/
- Hooks placed in controllers (not services) — controller has request context with principal type
- Guard audit hooks with PrincipalType.USER to skip SERVICE principals
- Test baseline after audit: 22 suites, 178 tests

## Alerts (complete)
- alertService at packages/server/api/src/app/alerts/ — structured stdout logging via Fastify pino
- AlertHandler interface kept for future swappability (e.g., email, Slack)
- Test baseline after alerts: 23 suites, 184 tests

## Templates (complete)
- TemplateType has CUSTOM only; TemplateScope: TEAM/GLOBAL added
- UI files still reference TemplateType.OFFICIAL/SHARED — fix in frontend phases
- Test baseline after templates: 24 suites, 189 tests

## UI Notes
- Frontend is React 19 + Vite + Tailwind 4 + shadcn/radix-ui
- npm install needs --legacy-peer-deps for React 19 peer dep conflicts
