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

## Test Baseline
- 22/24 failures pre-existing (@flow/piece-slack resolution), 2 passed, 16 tests pass — same as prior phases
