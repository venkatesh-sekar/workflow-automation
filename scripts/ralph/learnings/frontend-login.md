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
