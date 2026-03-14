# Learnings: copy-server-core

- Activepieces uses turbo + bun as build system; no typescript available globally — need workspace setup before typecheck works
- Server API tsconfig extends `../tsconfig.server.json` (needs parent config)
- Server API has ee/ subdirectory at `src/app/ee/` with ~20 modules — all excluded via rsync
- 1053 files copied (excluding ee/)
- Root package.json uses `"packageManager": "bun@1.3.3"` — may need npm alternative
- tsconfig chain: tsconfig.base.json → packages/server/tsconfig.server.json → packages/server/api/tsconfig.json → tsconfig.app.json
- npm doesn't support bun's `workspace:*` protocol — root package.json omits workspaces for now; will need workspace config when shared packages are copied
- Typecheck produces ~2089 errors: 1514 TS2307 (missing modules), 455 TS7006 (implicit any from missing types), rest cascading — all expected
- server/api package.json has devDeps on piece-facebook-leads, piece-intercom, piece-slack, piece-square (test fixtures?) — will need attention
