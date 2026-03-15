# Frontend Login Phase Learnings

## Auth Structure
- Existing auth UI: sign-in-form.tsx, sign-up-form.tsx, auth-form-template.tsx wrapping both
- Routes defined in auth-routes.tsx, imported by main router
- authenticationApi in packages/web/src/api/authentication-api.ts — needs teamLogin method
- authenticationSession.saveResponse(data, false) stores JWT + projectId in localStorage
- logOut() redirects to /sign-in — must change to /login
- useRedirectAfterLogin hook handles post-login redirect (defaults to /flows)
- Server endpoint: POST /v1/authentication/team-login with {email, apiKey}
- Frontend uses React 19 + shadcn/ui (Card, Button, Input, Form, Label)
- FullLogo component loads branding from flags API — will work as-is for now

## Testing
- Web package had no vitest/jsdom installed — added as devDependencies
- Existing utils.test.ts has pre-existing formatDate timezone failure (IST offset) — unrelated to login
- Web tests use `// @vitest-environment jsdom` directive and `vi.mock('i18next', ...)` pattern
- LoginSchema extracted to login-schema.ts for unit testability (avoids needing React component rendering)
