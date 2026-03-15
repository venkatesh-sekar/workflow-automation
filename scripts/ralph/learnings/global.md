# Global Learnings

Cross-phase insights. Max ~50 lines — consolidate when growing beyond.

## Build System
- npm with `file:` protocol for local deps; build upstream with `tsc -p tsconfig.lib.json`
- peerDependencies to avoid TS duplication; tsconfig paths + vitest resolve.alias

## Test Infrastructure
- vitest + pg-mem + redis-memory-server (MALLOC=libc); 24 suites, 191 tests

## Debrand Scope
- ~1080 files, ~4000+ `@activepieces/*` imports, ~800+ `Ap`-prefixed types
- Migration files UNTOUCHABLE; DB tables generic (no renames needed)

## Telemetry to Remove
- Segment: backend (@segment/analytics-node, key 42TtMD2...) + frontend (@segment/analytics-next, key Znobm6c...)
- PostHog: frontend (posthog-js, key phc_7F92...)
- Sentry: @sentry/node in exception-handler.ts, SENTRY_DSN env var
- Template telemetry: cloud + template-manager.activepieces.com URLs
- GitHub version check: raw.githubusercontent.com/activepieces/activepieces/main/package.json
- HyperDX: service name 'activepieces' → 'flow' (keep opt-in)
- OpenTelemetry: instrumentation.ts (keep opt-in, clean refs)

## Billing/Licensing to Remove
- Stripe: checkout sessions, subscription date fields, stripeCheckoutUrl
- License keys: /v1/license-keys verify/create, trial via sales.activepieces.com
- AppSumo: APPSUMO_TOKEN, APPSUMO_ACTIVEPIECES_TIER1-6 plan names

## Dead Third-Party Services to Remove
- Firebase Scrypt: password hasher (dead — team-login only)
- Cloudflare API: CLOUDFLARE_API_BASE/TOKEN/ZONE_ID (check if used)
- Featurebase: FEATUREBASE_API_KEY (feedback service)
- SCIM: SCIM_DEFAULT_PROJECT_ROLE (enterprise, likely dead)
- Google OAuth: GOOGLE_CLIENT_ID/SECRET (check pieces vs platform)

## Cloud Services to Remove
- piece-sync-service.ts: cloud.activepieces.com piece registry
- cloud-oauth2-service.ts: secrets.activepieces.com OAuth
- community-templates.service.ts: cloud template fetch
- apAxios base URL: api.activepieces.com

## External URLs (~80 refs)
- cdn.activepieces.com: logos, badges, videos, AI icons
- www.activepieces.com: docs, pricing, terms, privacy
- feedback/community/sales.activepieces.com

## Key Renames (DONE)
- apId()→flowId(), apAxios→flowAxios, apDayjs→flowDayjs
- All Ap-prefixed core types renamed to Flow prefix (17 types, ~900 refs)
- All Ap-prefixed UI components renamed to Flow prefix (~60 identifiers, ~350 refs)
- All ap-prefixed filenames renamed to flow- (31 files + 1 dir)
- workers/queue/migration/ files are runtime scripts, NOT DB migrations — safe to rename
- Rename longer/more specific names first in sed to avoid partial matches
- MCP tools in server/api also had ap- prefixed filenames — check server too, not just web
