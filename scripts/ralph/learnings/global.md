# Global Learnings

Cross-phase insights that affect future work. Max ~50 lines — consolidate when growing beyond.

## Build System
- Activepieces uses turbo + bun; we use npm — `workspace:*` protocol unsupported, need explicit versioning
- tsconfig chain: tsconfig.base.json → packages/server/tsconfig.server.json → packages/server/api/tsconfig.json → tsconfig.app.json
- server/api package.json has devDeps on piece-facebook-leads, piece-intercom, piece-slack, piece-square (test fixtures) — will need cleanup in fix-references

## Inter-package Dependencies
- Use `file:` protocol for local deps (e.g., `"@activepieces/shared": "file:../../shared"`) — npm doesn't support `workspace:*`
- Must build upstream packages (`tsc -p tsconfig.lib.json`) to produce dist/ for downstream type resolution
- Each package installs its own node_modules independently
- Shared packages copied: shared, pieces-framework, pieces-common, server-common, engine
- UI (packages/web) depends on: shared, pieces-framework, pieces-common
- Server/api depends on: shared, pieces-framework, pieces-common, server-common, engine
- Engine has 1 pre-existing type error (null vs undefined in externalId) — not from our changes

## EE Exclusion
- Server ee/ was at `src/app/ee/` with ~20 modules — all excluded; imports to ee/ paths exist throughout server code and must be resolved in fix-references
