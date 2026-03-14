# Learnings: copy-server-core

- Activepieces uses turbo + bun as build system; no typescript available globally — need workspace setup before typecheck works
- Server API tsconfig extends `../tsconfig.server.json` (needs parent config)
- Server API has ee/ subdirectory at `src/app/ee/` with ~20 modules — all excluded via rsync
- 1053 files copied (excluding ee/)
- Root package.json uses `"packageManager": "bun@1.3.3"` — may need npm alternative
