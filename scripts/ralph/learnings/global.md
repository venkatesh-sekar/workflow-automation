# Global Learnings

Cross-phase insights. Max ~50 lines — consolidate when growing beyond.

## Build System
- npm with `file:` protocol for local deps; build upstream with `tsc -p tsconfig.lib.json`
- peerDependencies to avoid TS duplication; tsconfig paths + vitest resolve.alias

## Test Infrastructure
- vitest + pg-mem + redis-memory-server (MALLOC=libc); 24 suites, 191 tests
- Pre-existing: 22/24 suites fail on @flow/piece-slack resolution — not caused by debranding

## Debrand Scope
- ~1080 files, ~4000+ `@activepieces/*` imports, ~800+ `Ap`-prefixed types
- Migration files UNTOUCHABLE; DB tables generic (no renames needed)
- workers/queue/migration/ are runtime scripts, NOT DB migrations — safe to rename
- Rename longer/more specific names first in sed to avoid partial matches
- MCP tools in server/api also had ap- prefixed filenames — check server too, not just web

## Completed Phases
- rename-packages: 35 package.json, ~1084 import files
- rename-ap-core-types: 17 types, ~900 refs
- rename-ap-ui-components: ~60 identifiers, ~350 refs, 31 files + 1 dir
- rename-ap-system-props: AppSystemProp→FlowSystemProp, WorkerSystemProp→FlowWorkerSystemProp
- strip-telemetry: Segment/PostHog/Sentry/template-telemetry/HyperDX/OTEL/GitHub version check
- strip-billing-and-licensing: Stripe, license keys, cloud sync/OAuth/templates, AppSumo, Firebase Scrypt, Cloudflare/Featurebase/SCIM env vars, cloud API base URLs

## Key Insights from Billing Phase
- No server-side billing routes — API calls went to external cloud service
- SCIM shared types still exist in packages/shared/src/lib/ee/scim/ — only barrel export, no server consumer
- Frontend still has secrets.activepieces.com refs (oauth2-connection-settings.tsx, oauth-apps.ts) — for strip-external-urls
- Test files have cloud.activepieces.com as fixture URLs — harmless but clean in strip-external-urls
- auth-form-template.tsx still has `cloud.activepieces.com` hostname check — for clean-dead-code phase

## External URLs (~80 refs remaining)
- cdn.activepieces.com: logos, badges, videos, AI icons
- www.activepieces.com: docs, pricing, terms, privacy
- secrets.activepieces.com: frontend OAuth redirect/claim
- Test fixture URLs with cloud.activepieces.com
