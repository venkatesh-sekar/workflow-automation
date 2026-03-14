# Ralph Flow Agent Instructions

You are an autonomous agent forking Activepieces v0.79.2 into "Flow" — an internal workflow automation tool. Each invocation you make ONE incremental change. You are called repeatedly by a shell loop.

## Source References
- Design doc: `docs/plans/2026-03-15-flow-mvp-design.md` (the spec — read relevant sections per phase)
- Activepieces source: `/primary01/git/activepieces/` (read-only reference for copying)
- This project: `/home/venkatesh/workflow-automation/` (where you write)

## Your Loop (one invocation = one change)

### Step 1: Read state
1. Read `scripts/ralph/tracker.json` — current phase, completed items, phase queue
2. Read `scripts/ralph/progress.txt` (last 50 lines) — recent history
3. Read `scripts/ralph/learnings/global.md` — cross-phase insights
4. Read `scripts/ralph/learnings/{current_phase}.md` if it exists — phase-specific insights
5. Read the section of the design doc relevant to the current phase

### Step 2: Assess current phase
- Check the acceptance criteria for the current phase in tracker.json
- Verify each criterion against the actual codebase (check files, run commands — don't trust tracker alone)
- If ALL criteria are met:
  1. Mark phase status as `"complete"` in tracker.json
  2. Move phase name to `completed_phases` array
  3. Promote key learnings from `learnings/{current_phase}.md` to `learnings/global.md` (consolidate — keep global.md under 50 lines)
  4. Pop next phase from `phase_queue` and set as `current_phase`
  5. If `phase_queue` is empty and current phase is complete: create `scripts/ralph/DONE` file and END
  6. Commit: `ralph(#{iteration}): complete {phase} — advance to {next_phase}`
  7. Log phase completion in progress.txt and END this iteration

### Step 3: Pick the next smallest change
- Look at what's incomplete for this phase
- Pick the SMALLEST possible incremental step:
  - Copy one package/directory
  - Fix one broken import
  - Remove one dead reference
  - Add one function/endpoint
  - Write one test
- Never do two unrelated things in one iteration
- If this is the first iteration of a phase, create `scripts/ralph/learnings/{current_phase}.md`

### Step 4: Implement
- Make the change
- Run the quality gate for this phase:
  - `"typecheck"`: run the TypeScript compiler, allow errors from not-yet-copied packages
  - `"full"`: run TypeScript compiler + full test suite — both must pass
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
3. Commit all changes: `ralph(#{iteration}): {phase} — {brief description}`
4. Append to `scripts/ralph/progress.txt`:
```
## Iteration #N - {phase}
- **Change:** {what was done}
- **Files:** {files changed}
- **Quality gate:** {pass/fail}
- **Learnings:** {any insights, or "none"}
---
```

## Phase Autonomy

You may reorder, split, or insert phases if you discover dependencies or issues not anticipated in the original plan. When doing so:
1. Log the reason in `learnings/global.md`
2. Update `phase_queue` and/or `inserted_phases` in tracker.json
3. Commit: `ralph(#{iteration}): reorder/insert phase — {reason}`

## Learnings Management

- `learnings/global.md` — read every iteration, max ~50 lines. When it grows beyond, consolidate related entries.
- `learnings/{phase}.md` — created when a phase starts, read only during that phase. Captures phase-specific discoveries.
- When completing a phase, promote only insights relevant to future phases into global.md. Phase file stays as archive.

## Rules
- ONE change per iteration — never scope-creep
- Always read state before doing anything
- Always verify quality gate before committing
- Verify against actual codebase, not just tracker state
- If you discover something affecting a future phase, note it in global learnings
- Never skip the quality gate
- If stuck after 2 failed attempts, log it and move on — next invocation gets a fresh context
- **NEVER copy, reference, or import any file from `packages/ee/` or `packages/server/api/src/app/ee/` in the Activepieces source.** These directories contain proprietary Enterprise Edition code. Any functionality we need (audit logs, templates, project members, alerts) must be implemented from scratch as new MIT-licensed code. If you encounter an import pointing to an `ee/` path, remove or replace it — never resolve it by copying the EE source.

## Stop Condition
You never stop on your own mid-phase. The loop runner controls iterations. End normally after completing one change — another invocation will continue. Only create the DONE file when all phases are complete.
