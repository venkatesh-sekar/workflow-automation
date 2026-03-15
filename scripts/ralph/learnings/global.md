# Global Learnings

Cross-phase insights that affect future work. Max ~50 lines — consolidate when growing beyond.

## Build System
- npm with `file:` protocol for local deps (not bun's `workspace:*`)
- Must build upstream packages (`tsc -p tsconfig.lib.json`) for dist/ type resolution
- peerDependencies to avoid TS type duplication across file:-linked packages
- tsconfig paths work for typecheck but NOT vitest runtime — also add resolve.alias

## Package Structure
- Shared: shared, pieces-framework, pieces-common, server-common, engine
- Worker NOT copied — stubbed via helper/worker-stub.ts + tsconfig paths
- 21 piece dirs: 19 core + 2 community (slack, postgres)

## Test Infrastructure
- vitest + pg-mem + redis-memory-server (MALLOC=libc patch)
- dayjs plugins in vitest.setup.ts; reflect-metadata required at runtime
- Current baseline: 24 suites, 191 tests

## Auth System (complete)
- Team-login only: POST /v1/authentication/team-login with {email, apiKey}
- user-identity removed — user has email/firstName/lastName/verified/tokenVersion
- CLI scripts: create-team, add-member, rotate-key
- API key: `flow_<64-hex>`, SHA-256 hash in project.apiKeyHash

## Env Vars (complete)
- All env vars use FLOW_ prefix; enum values don't include prefix (added dynamically)

## Backend Features (complete)
- AI providers: OpenAI only; migration files keep old enums as `as any` strings
- Audit logs: audit_event entity at packages/server/api/src/app/audit-event/
- Alerts: structured stdout logging via Fastify pino; AlertHandler interface
- Templates: CUSTOM type only; TemplateScope: TEAM/GLOBAL

## UI Notes
- React 19 + Vite + Tailwind 4 + shadcn/radix-ui
- npm install needs --legacy-peer-deps for React 19 peer dep conflicts
- Login page at /login with email+team-key; /sign-in kept as backward-compat redirect
- All auth redirects point to /login; post-login goes to /automations
- Web tests use `// @vitest-environment jsdom` + `vi.mock('i18next', ...)`
- Old sign-up-form.tsx and auth-form-template.tsx still exist but are dead code (no route)
- TemplateType.OFFICIAL/SHARED refs remain in UI — fix in frontend phases
- Sidebar: dashboard/index.tsx has Templates only; Automations/Runs/Connections are header tabs in project-dashboard-layout-header.tsx
- Platform sidebar (platform/index.tsx) still has Billing entry but unreachable from normal nav
- Settings: project settings dialog has General/Members/Alerts tabs only; account settings in sidebar-user.tsx dropdown
- Dead code remaining: alerts feature barrel (features/alerts/), git-sync API/hooks, old sign-up forms

## Branding (complete)
- Dynamic branding: server defaultTheme → flags API → theme-provider.tsx sets title/favicon/CSS vars
- websiteName='Flow', primaryColor='#dc2626' (red), local favicon.ico
- Remaining 'Activepieces' refs are code-level (SDK types, imports, comments) — not user-visible

## Deployment (complete)
- Docker: multi-stage build, Node 22, per-package npm install (no workspaces)
- Build order: shared → framework → common → server-common → engine → server/api → web
- Runtime: nginx (SPA + API proxy) + node server, docker-entrypoint.sh with NODE_PATH
- Key gotchas: typeorm symlink for server-common, worker-module bridge, piece npm install loop
- Health: GET /v1/health, docker-compose service_healthy dependencies
- All 16 phases complete. 129 iterations. 191 tests passing.
