# Learnings: rename-ap-core-types

## Pre-existing test failures
- 22/24 test suites fail due to `@flow/piece-slack` not resolving in vitest
- This is from rename-packages phase (quality gate was typecheck-only, not full)
- These failures are NOT caused by core type renames
- Need to treat "same failure count" as passing for this phase

## Bulk sed approach
- `ActivepiecesError` → `FlowError`: 169 occurrences across 54 files, bulk sed worked cleanly
- File rename via `git mv` + import path sed works well for combined file+class rename
- When renaming related identifiers (ApId/apId/ApIdSchema/secureApId), rename longer names first to avoid partial matches
- ApId+apId+ApIdSchema+secureApId: ~400 total refs across ~65 files — mechanical sed works perfectly
