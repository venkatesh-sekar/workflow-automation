# Final Sweep Learnings

## Remaining items discovered
- tsconfig.base.json had 5 @activepieces/* path aliases missed in rename-packages phase
- typings.d.ts + embed/ files have ~30 ActivepiecesClient*/ActivepiecesVendor* type refs — need renaming
- flags.test.ts has "Activepieces" in test assertions checking branding is REMOVED — these are fine (negative assertions)
- migrate-v9-ai-pieces.ts has `provider: 'activepieces'` — untouchable (runtime flow data)
- .claude/settings.local.json refs /primary01/git/activepieces — external path, not branding
