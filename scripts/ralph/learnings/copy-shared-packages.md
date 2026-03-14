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

## Remaining packages to copy
- @activepieces/server-common (packages/server/common/) — depends on pieces-framework + shared
- @activepieces/pieces-common (packages/pieces/common/) — likely depends on pieces-framework + shared
- @activepieces/engine (packages/server/engine/) — depends on shared
