# Learnings: copy-shared-packages

## @activepieces/shared
- 202 files, compiles cleanly with dayjs added as missing dependency
- dayjs was a root-level dep in activepieces monorepo, not declared in shared/package.json — had to add explicitly
- Has its own node_modules installed standalone (not using workspace linking yet)
- tsconfig.lib.json is the compilation config (tsconfig.json just sets references)
- Must build shared (`tsc -p tsconfig.lib.json`) to produce dist/ before downstream packages can resolve types

## @activepieces/pieces-framework
- 43 files, depends on @activepieces/shared only (among internal deps)
- Uses `file:../../shared` in package.json to resolve local shared package (npm doesn't support `workspace:*`)
- Shared must have dist/ built before framework typecheck works (package.json points to dist/src/index.d.ts)
- tsconfig.lib.json has `"paths": {}` — relies on node_modules resolution, not path mappings

## Cross-package dependency pattern
- Use `file:` protocol in package.json for inter-package deps (e.g., `"@activepieces/shared": "file:../../shared"`)
- Build upstream packages first so dist/ exists for type resolution
- Each package installs its own node_modules independently (no root workspace linking)

## @activepieces/pieces-common
- 20 src files, depends on pieces-framework + shared (confirmed)
- Same file: protocol pattern for local deps works
- Framework must have dist/ built before common can typecheck (framework didn't have dist/ from prior iteration — had to rebuild)
- Compiles cleanly with no errors

## @activepieces/server-common
- 38 src files, depends on pieces-framework + shared (among internal deps)
- Has many external deps: bullmq, fastify, typeorm, ioredis, pino, redlock, axios, sentry, etc.
- Same file: protocol pattern works for local deps
- Compiles cleanly with no errors
- Located at packages/server/common/ — extends ../tsconfig.server.json (already exists)

## @activepieces/engine
- 46 src files, depends on shared + pieces-framework + pieces-common
- Has external deps: ai, axios, isolated-vm, socket.io-client, zod, etc.
- 1 pre-existing type error: engine-constants.ts:246 — `project.externalId` is `string | null` but function returns `Promise<string | undefined>` (null vs undefined mismatch)
- Located at packages/server/engine/, extends ../tsconfig.server.json
- server/api package.json lists engine as a dependency

## Remaining packages to assess
- Need to check if all shared deps are now covered or if UI has additional shared deps
- server/api still uses workspace:* for its deps — will need file: updates (possibly in fix-references phase)
