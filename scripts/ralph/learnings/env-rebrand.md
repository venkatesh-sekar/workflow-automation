# Env Rebrand Phase Learnings

## Architecture
- Env var prefix `AP_` is centralized in TWO files:
  - `packages/server/common/src/lib/system-props.ts` line 156: `'AP_' + prop`
  - `packages/server/common/src/lib/env-migrations.ts` line 6: envPrefix function, line 21: hardcoded `AP_QUEUE_MODE`
- All env reads flow through `environmentVariables.getEnvironment()` → `environmentMigrations.migrate()` → `envPrefix()`
- Additional hardcoded `AP_` string references in error messages:
  - `packages/server/engine/src/lib/core/code/code-sandbox.ts` (1 reference)
  - `packages/server/api/src/app/helper/system-validator.ts` (4 references)
- No Docker Compose files exist yet (deployment phase will create them)
- Enum values (e.g., `ENCRYPTION_KEY = 'ENCRYPTION_KEY'`) do NOT have the prefix — prefix is added at read time
