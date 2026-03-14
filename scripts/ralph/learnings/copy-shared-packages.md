# Learnings: copy-shared-packages

## @activepieces/shared
- 202 files, compiles cleanly with dayjs added as missing dependency
- dayjs was a root-level dep in activepieces monorepo, not declared in shared/package.json — had to add explicitly
- Has its own node_modules installed standalone (not using workspace linking yet)
- tsconfig.lib.json is the compilation config (tsconfig.json just sets references)
