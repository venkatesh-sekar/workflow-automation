# Phase: rename-packages

## Learnings
- Package.json `name` fields are independent of TypeScript module resolution — tsconfig `paths` is what matters for tsc
- All deps use `file:` protocol pointing to local paths, so renaming dep keys from @activepieces to @flow works atomically
- 35 packages total with @activepieces scope; `api` and `web` and `worker` don't use the scope
- Typecheck uses tsconfig paths, not package.json names — so renaming package.json doesn't break compilation
- tsconfig paths with @activepieces exist in: packages/web/tsconfig.app.json, packages/web/tsconfig.spec.json
- Bulk sed across 1070 files worked cleanly — no edge cases with @activepieces in strings vs imports
- dist/ dirs contain stale package.json copies — ignored (regenerate on build)
- 12 vitest/vite config files had @activepieces resolve aliases
