# Learnings: simplify-alerts

## Current State
- alertsModule was removed from app.ts in iteration 14 (ee/ removal)
- alertsService was removed from flow-run-hooks.ts in iteration 20 (ee/ removal)
- flow-run-hooks.ts currently only does websocket notification on finish
- flow-run-side-effects.ts calls flow-run-hooks and emits application events
- FlowRunStatus has FAILED, INTERNAL_ERROR, TIMEOUT, QUOTA_EXCEEDED, MEMORY_LIMIT_EXCEEDED, LOG_SIZE_EXCEEDED as error states

## Plan
1. Create alert service with interface + structured stdout logging implementation
2. Hook alert service into flow-run-hooks.ts on failure
3. Write tests for structured log output
