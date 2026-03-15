# Ralph Debrand Agent Instructions

You are an autonomous agent removing ALL Activepieces branding from the Flow codebase. Each invocation you make ONE incremental change. You are called repeatedly by a shell loop.

## Mission
Remove every trace of "Activepieces", "activepieces", "@activepieces", and "Ap" prefixed identifiers. This is a fully internal tool — no external links, no attribution, no references to the upstream project needed.

## Source References
- This project: `/home/venkatesh/workflow-automation/` (where you read and write)
- Tracker: `scripts/ralph/tracker.json`
- Progress: `scripts/ralph/progress.txt`
- Learnings: `scripts/ralph/learnings/`

## Naming Conventions
| Old | New |
|-----|-----|
| `@activepieces/*` | `@flow/*` |
| `ActivepiecesError` | `FlowError` |
| `ApId` | `FlowId` |
| `ApIdSchema` | `FlowIdSchema` |
| `ApEnvironment` | `FlowEnvironment` |
| `ApEdition` | `FlowEdition` |
| `ApFlagId` | `FlowFlagId` |
| `ApFile` | `FlowFile` |
| `ApErrorParams` | `FlowErrorParams` |
| `ApMultipartFile` | `FlowMultipartFile` |
| `ApLock` | `FlowLock` |
| `ApSemaphore` | `FlowSemaphore` |
| `ApQueueJob` | `FlowQueueJob` |
| `ApStorage` | `FlowStorage` |
| `ApSubscriptionStatus` | `FlowSubscriptionStatus` |
| `AppSystemProp` | `FlowSystemProp` |
| `WorkerSystemProp` | `FlowWorkerSystemProp` |
| `SharedSystemProp` | `FlowSharedSystemProp` |
| `Ap{Component}` (UI) | `Flow{Component}` |
| `ap-{file}` (filenames) | `flow-{file}` |
| `activepieces-error.ts` | `flow-error.ts` |
| `apId` (function) | `flowId` |
| `apAxios` / `ap-axios.ts` | `flowAxios` / `flow-axios.ts` |
| `apDayjs` | `flowDayjs` |
| `"Activepieces"` (strings) | `"Flow"` |
| `activepieces.com` URLs | Remove entirely |
| `cdn.activepieces.com` | Local assets or remove |
| `cloud.activepieces.com` | Remove (no cloud) |
| `secrets.activepieces.com` | Remove (no cloud OAuth) |
| `community.activepieces.com` | Remove |
| `feedback.activepieces.com` | Remove |
| `sales.activepieces.com` | Remove |

## Your Loop (one invocation = one change)

### Step 1: Read state
1. Read `scripts/ralph/tracker.json` — current phase, completed items, phase queue
2. Read `scripts/ralph/progress.txt` (last 50 lines) — recent history
3. Read `scripts/ralph/learnings/global.md` — cross-phase insights
4. Read `scripts/ralph/learnings/{current_phase}.md` if it exists — phase-specific insights

### Step 2: Assess current phase
- Check the acceptance criteria for the current phase in tracker.json
- Verify each criterion against the actual codebase (check files, run commands — don't trust tracker alone)
- If ALL criteria are met:
  1. Mark phase status as `"complete"` in tracker.json
  2. Move phase name to `completed_phases` array
  3. Promote key learnings from `learnings/{current_phase}.md` to `learnings/global.md` (consolidate — keep global.md under 50 lines)
  4. Pop next phase from `phase_queue` and set as `current_phase`
  5. If `phase_queue` is empty and current phase is complete: create `scripts/ralph/DONE` file and END
  6. Commit: `ralph(#{iteration}): chore({phase}): complete phase — advance to {next_phase}`
  7. Log phase completion in progress.txt and END this iteration

### Step 3: Pick the next smallest change
- Look at what's incomplete for this phase
- Pick the SMALLEST possible incremental step:
  - Rename one package name in all package.json files
  - Update imports for one package across the codebase
  - Rename one type/class and all its references
  - Rename one file and update its imports
  - Clean one category of string references
- Never do two unrelated things in one iteration
- If this is the first iteration of a phase, create `scripts/ralph/learnings/{current_phase}.md`

### Step 4: Implement
- Make the change
- Use find-and-replace patterns aggressively — most changes are mechanical renames
- For package renames: update package.json `name` field, then update ALL imports across ALL packages
- For type renames: rename the export, then update ALL references across ALL packages
- For file renames: `git mv` the file, then update ALL imports
- Run the quality gate for this phase:
  - `"typecheck"`: run `npx tsc -p packages/server/api/tsconfig.json --noEmit 2>&1 | tail -5` (check error count)
  - `"full"`: run TypeScript compiler + `cd packages/server/api && npx vitest run 2>&1 | tail -10`
- If quality gate fails:
  - Attempt to fix (up to 2 tries)
  - If still failing, revert with `git checkout -- .` (preserve tracker/progress/learnings)
  - Log the failure in progress.txt with what went wrong
  - END this iteration (next invocation will retry with different approach)

### Step 5: Update tracker and commit
1. Update `scripts/ralph/tracker.json`:
   - Increment `iteration`
   - Add entry to current phase's `completed_items`: `{"iteration": N, "description": "what was done"}`
2. Add any learnings to `scripts/ralph/learnings/{current_phase}.md`
3. Commit all changes using conventional commit format: `ralph(#{iteration}): {type}({phase}): {brief description}` — where type is one of: feat, fix, refactor, chore, test, docs
4. Append to `scripts/ralph/progress.txt`:
```
## Iteration #N - {phase}
- **Change:** {what was done}
- **Files:** {files changed count}
- **Quality gate:** {pass/fail}
- **Learnings:** {any insights, or "none"}
---
```

## Bulk Rename Strategy

For large renames (like @activepieces → @flow in imports), use `sed` or `find + sed` for mechanical replacement:

```bash
# Example: rename all @activepieces/shared imports to @flow/shared
find packages/ -name '*.ts' -o -name '*.tsx' -o -name '*.mts' | \
  grep -v node_modules | grep -v dist | \
  xargs sed -i "s|@activepieces/shared|@flow/shared|g"
```

Always verify after bulk sed by checking TypeScript compilation.

## Telemetry & Analytics Removal

This is a fully internal tool. ALL external telemetry must be removed:

### Segment (CRITICAL — hardcoded API keys)
- **Backend**: `packages/server/api/src/app/helper/telemetry.utils.ts`
  - Dependency: `@segment/analytics-node`
  - Write key: `42TtMD2Fh9PEIcDO2CagCGFmtoPwOmqK`
  - Functions: `identify()`, `track()` — sends user ID, email, name, projectId
  - **Action**: Remove dep, gut the file (make identify/track no-ops or delete entirely)
- **Frontend**: `packages/web/src/components/providers/telemetry-provider.tsx`
  - Dependency: `@segment/analytics-next`
  - Write key: `Znobm6clOFLZNdMFpZ1ncf6VDmlCVSmj`
  - **Action**: Remove dep, strip Segment init/identify/track

### PostHog (CRITICAL — hardcoded API key)
- **Frontend**: `packages/web/src/components/providers/telemetry-provider.tsx`
  - Dependency: `posthog-js`
  - API key: `phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh`
  - **Action**: Remove dep, strip PostHog init/identify

### Template Telemetry
- `packages/server/api/src/app/template/template-telemetry/template-telemetry.service.ts`
  - URLs: `cloud.activepieces.com/api/v1/templates-telemetry` and `template-manager.activepieces.com`
  - Events: VIEW, INSTALL, ACTIVATE, DEACTIVATE
  - **Action**: Gut the service, remove all event sending

### HyperDX (Optional Logging)
- `packages/server/common/src/lib/logger/hyperdx-pino.ts`
  - Service name hardcoded as `'activepieces'` — change to `'flow'`
  - Keep as opt-in if HYPERDX_API_KEY configured

### Sentry (Error Tracking)
- `packages/server/common/src/lib/exception-handler.ts`
  - Dependency: `@sentry/node`
  - Config: `SENTRY_DSN` env var
  - **Action**: Remove dep, gut Sentry init, keep error handler but remove external reporting

### GitHub Version Check (Phone Home)
- `packages/server/common/src/lib/system-props.ts` line 179
  - URL: `https://raw.githubusercontent.com/activepieces/activepieces/main/package.json`
  - **Action**: Remove version check entirely — no auto-update needed

### OpenTelemetry
- `packages/server/api/src/instrumentation.ts`
  - OTEL trace + metric exporters
  - **Action**: Keep as opt-in infrastructure but remove any "activepieces" service names

### TELEMETRY_ENABLED Flag
- After removing all telemetry, remove the flag and all conditional checks

## Billing & Licensing Removal

### Stripe
- `packages/web/src/features/billing/api/billing-plans-api.ts`
  - Endpoints: create-checkout-session, update-active-flows-addon, ai-credits checkout
  - Returns: `stripeCheckoutUrl`
  - **Action**: Remove billing API, remove Stripe references
- `packages/server/api/src/app/platform/platform.service.ts`
  - Fields: `stripeSubscriptionStartDate`, `stripeSubscriptionEndDate`
  - **Action**: Remove Stripe fields from platform entity

### License Keys
- `packages/web/src/api/platforms-api.ts` — POST /v1/license-keys/verify and /v1/license-keys
- `packages/web/src/features/billing/api/request-trial-api.ts` — POST to sales.activepieces.com
- **Action**: Remove license key verification, trial request API, request-trial component

### Cloud Services
- `packages/server/api/src/app/pieces/piece-sync-service.ts` — cloud.activepieces.com piece registry
  - **Action**: Remove OFFICIAL_AUTO cloud sync, pieces are local only
- `packages/server/api/src/app/app-connection/app-connection-service/oauth2/services/cloud-oauth2-service.ts` — secrets.activepieces.com OAuth
  - **Action**: Remove cloud OAuth, self-hosted only
- `packages/server/api/src/app/template/community-templates.service.ts` — cloud template fetch
  - **Action**: Remove cloud template fetching

### Dead Third-Party Integrations
- **AppSumo**: `APPSUMO_TOKEN` env var, `APPSUMO_ACTIVEPIECES_TIER1-6` plan names — remove
- **Firebase Scrypt**: `firebase-scrypt` dep, `FIREBASE_ADMIN_CREDENTIALS`, `FIREBASE_HASH_PARAMETERS` — dead since team-login, remove
- **Cloudflare API**: `CLOUDFLARE_API_BASE/TOKEN/ZONE_ID` env vars — remove if unused
- **Featurebase**: `FEATUREBASE_API_KEY` — feedback service, remove
- **SCIM**: `SCIM_DEFAULT_PROJECT_ROLE` — enterprise feature, remove if dead
- **Google OAuth**: `GOOGLE_CLIENT_ID/SECRET` — check if used by pieces vs platform auth

## External URL Strategy

This is a fully internal tool. NO external links should remain:
- **cdn.activepieces.com piece logos**: Replace with local `/pieces/{name}.svg` paths or empty string. Copy SVGs from activepieces source to `packages/web/public/pieces/` if needed.
- **cloud.activepieces.com**: Remove entirely — no cloud dependency.
- **secrets.activepieces.com** (OAuth redirect/claim/refresh): Remove cloud OAuth service. Self-hosted only.
- **sales/feedback/community.activepieces.com**: Remove entirely.
- **www.activepieces.com/docs**: Remove or replace with empty string (internal tool, no external docs).
- **www.activepieces.com/pricing, /terms, /privacy**: Remove.
- **Badge GIF URLs**: Remove badge system entirely or replace with local assets.
- **Template telemetry URLs**: Remove (no external telemetry).
- **Piece sync cloud URL**: Remove (pieces are local only).

## Database Considerations
- DB table names are generic (project, flow, flow_run, etc.) — no renames needed.
- DB column names don't reference "activepieces" — no migrations needed.
- Migration files are historical — don't touch them.

## Exclusions
- **Migration files** (`packages/server/api/src/app/database/migration/`): Do NOT rename identifiers in migration files. These are historical and reference database columns/tables that must not change.
- **node_modules/**, **dist/**, **package-lock.json**: Skip these — they regenerate.
- **Translation JSON files** (`locales/*.json`): Clean string values (replace "Activepieces" with "Flow") but don't rename keys.

## Phase Autonomy

You may reorder, split, or insert phases if you discover dependencies or issues not anticipated in the original plan. When doing so:
1. Log the reason in `learnings/global.md`
2. Update `phase_queue` and/or `inserted_phases` in tracker.json
3. Commit: `ralph(#{iteration}): chore(phases): reorder/insert phase — {reason}`

## Rules
- ONE change per iteration — never scope-creep
- Always read state before doing anything
- Always verify quality gate before committing
- Verify against actual codebase, not just tracker state
- If you discover something affecting a future phase, note it in global learnings
- Never skip the quality gate
- If stuck after 2 failed attempts, log it and move on — next invocation gets a fresh context
- Migration files are UNTOUCHABLE for renames — they reference DB column names

## Stop Condition
You never stop on your own mid-phase. The loop runner controls iterations. End normally after completing one change — another invocation will continue. Only create the DONE file when all phases are complete.
