# Global Learnings

Cross-phase insights that affect future work. Max ~50 lines — consolidate when growing beyond.

## Build System
- Activepieces uses turbo + bun; we use npm — `workspace:*` protocol unsupported, need explicit versioning
- tsconfig chain: tsconfig.base.json → packages/server/tsconfig.server.json → packages/server/api/tsconfig.json → tsconfig.app.json
- server/api package.json has devDeps on piece-facebook-leads, piece-intercom, piece-slack, piece-square (test fixtures) — will need cleanup in fix-references

## EE Exclusion
- Server ee/ was at `src/app/ee/` with ~20 modules — all excluded; imports to ee/ paths exist throughout server code and must be resolved in fix-references
