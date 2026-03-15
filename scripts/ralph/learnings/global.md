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
- strip-external-urls: ~60 CDN URLs emptied, all www/secrets/feedback/community URLs removed
- clean-strings-and-comments: translation files, README.md build commands, JWT issuer, MCP strings, test URLs
- clean-dead-code: features/alerts/ dir, use-partner-stack.ts, isCloudPlanButNotEnterprise guard, badge CDN URLs already emptied

## Key Insights
- No server-side billing routes — API calls went to external cloud service
- SCIM shared types still exist in packages/shared/src/lib/ee/scim/ — only barrel export, no server consumer
- Test assertions checking URLs don't contain activepieces.com are fine (flags.test.ts)
- Embed types renamed in final-sweep (#64): ActivepiecesClient*→FlowClient*, ActivepiecesVendor*→FlowVendor*
- migrate-v9-ai-pieces.ts has `provider: 'activepieces'` — left untouched (runtime flow data, changing breaks existing flows)
- AP_FRONTEND_URL env var name preserved (not renamed — separate concern)

## COMPLETE
- All 10 phases done. 65 iterations total. Zero activepieces refs in source code.
