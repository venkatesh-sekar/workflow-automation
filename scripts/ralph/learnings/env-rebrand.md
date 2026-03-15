# Env Rebrand Phase Learnings

## Architecture
- Env var prefix `AP_` was centralized in TWO files (now `FLOW_`):
  - `packages/server/common/src/lib/system-props.ts`: `'FLOW_' + prop`
  - `packages/server/common/src/lib/env-migrations.ts`: envPrefix function
- All env reads flow through `environmentVariables.getEnvironment()` → `environmentMigrations.migrate()` → `envPrefix()`
- No Docker Compose files exist yet (deployment phase will create them)
- Enum values (e.g., `ENCRYPTION_KEY = 'ENCRYPTION_KEY'`) do NOT have the prefix — prefix is added at read time

## Remaining AP_ in Code (NOT env vars — no action needed)
- `AP_NODE_SIZE` — UI canvas constant (consts.ts, flow-canvas-utils.ts)
- `AP_MAXIMUM_PROFILE_PICTURE_SIZE` — shared constant (user.ts)
- `AP_PAUSED_FLOW_TIMEOUT_DAYS` — local variable name (piece-executor.ts, env read already uses FLOW_)
- `DB_GLOBAL_KEY = '__AP_DB_CONNECTION__'` — internal TypeORM key (database-connection.ts)
- `GAP_SIZE_FOR_STEP_SETTINGS` — contains "AP" as part of "GAP" (utils.ts)
