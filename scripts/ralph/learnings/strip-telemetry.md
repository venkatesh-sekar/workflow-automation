# Strip Telemetry Phase Learnings

## Segment Backend
- telemetry.utils.ts had Analytics import + hardcoded write key + identify/track/trackProject/trackUser/trackPlatform methods
- 3 callers: flow.service.ts, flow-run-module.ts, mcp-service.ts — all just call trackProject/trackUser
- Gutted to no-ops preserving the exported interface so callers don't break
- @segment/analytics-node dep removed from packages/server/api/package.json
- Note: @segment/analytics-next (frontend) is ALSO in api package.json line 51 — likely misplaced, handle with frontend Segment removal

## Segment Frontend + PostHog
- telemetry-provider.tsx had Segment AnalyticsBrowser + PostHog init/identify/track with hardcoded API keys
- Gutted to no-op wrapper keeping exported interface (TelemetryProvider, useTelemetry, TelemetryContextType)
- @segment/analytics-next was also misplaced in server/api/package.json — removed from both web and server/api
- posthog-js removed from web/package.json

## Sentry
- exception-handler.ts: @sentry/node import, Sentry.init with DSN, captureException in handle()
- SENTRY_DSN referenced in: FlowSystemProp enum (system-props.ts), system-validator.ts, server.ts (initializeSentry call), machine-service.ts (worker config), shared workers/index.ts (zod schema)
- Gutted to just log.error — kept handle() method signature since callers depend on it

## Template Telemetry
- template-telemetry.service.ts had two external URLs: cloud.activepieces.com and template-manager.activepieces.com
- Used TEMPLATE_MANAGER_API_KEY system prop for internal URL auth
- Called from trigger-source-service.ts (ACTIVATE/DEACTIVATE events) and template-telemetry.controller.ts (HTTP endpoint)
- Kept controller + shared types intact, just gutted service to no-op — callers still work harmlessly
- Removed TEMPLATE_MANAGER_API_KEY from system-props.ts enum and system-validator.ts

## GitHub Version Check
- getLatestRelease() in system-props.ts fetched from raw.githubusercontent.com/activepieces — removed phone-home
- Kept method signature since flag.service.ts uses it for LATEST_VERSION flag — now returns current version
- axios import was only used for this; removed it along with cachedVersion and PackageJson type

## Test Baseline
- 22/24 failures pre-existing (@flow/piece-slack resolution), 2 passed, 16 tests pass — same as prior phases
