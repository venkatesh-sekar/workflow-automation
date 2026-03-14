# Learnings: copy-ui-core

## UI Package Structure
- Frontend app is `packages/web/` (834 files) — React 19 + Vite + Tailwind 4 + shadcn/radix-ui
- `packages/react-ui/` only contains `public/locales/` (i18n translations) — not the main app
- Web package depends on: shared, pieces-framework, pieces-common (same as noted in global)
- Web package had `ee-embed-sdk` dependency (workspace:*) — removed since it's EE code from packages/ee/
- tsconfig.app.json had path mappings for `ee-embed-sdk` and `@activepieces/piece-ai` — removed

## Typecheck Status
- 4 TS2307 errors: 3 for ee-embed-sdk (embedded-connection-dialog, embed/index, home-button), 1 for html-to-image (impact-utils)
- These are expected missing module errors per criteria
- vite added as devDep for vite/client types
- npm install needs --legacy-peer-deps flag due to React 19 peer dep conflicts

## Notes for Future Phases
- Files importing ee-embed-sdk will need cleanup in fix-references phase
- The embed routes (src/app/routes/embed/) are EE-related — likely candidates for removal
- impact routes reference html-to-image — may also be removable
