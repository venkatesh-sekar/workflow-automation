# Strip Billing & Licensing Phase Learnings

## Starting Notes
- Key targets: Stripe, license keys, cloud services, AppSumo, Firebase Scrypt, Cloudflare, Featurebase, SCIM

## Billing Architecture
- No server-side platform-billing routes exist in this codebase — API calls go to external cloud service
- billing-plans-api.ts is purely frontend; billing-hooks.ts wraps it in React Query mutations/queries
- Shared types (UpdateActiveFlowsAddonParams, CreateSubscriptionParams, etc.) live in @flow/shared ee/billing/index.ts
- Stripe price IDs (dev/prod) hardcoded in shared/ee/billing/index.ts PRICE_ID_MAP
- APPSUMO_PLAN helper also in shared/ee/billing/index.ts
- PlatformPlan schema in shared/management/platform/platform.model.ts has stripe* fields
- platform.service.ts getPlan() returns OPEN_SOURCE_PLAN with stripeSubscriptionStartDate: 0

## Component Dependencies on Billing Mutations
- 7 components reference billingMutations.use* — these will break at runtime but not at compile time (billingMutations is now empty {})
- Next: need to gut those components or remove the dead mutation references

## Stripe Env Vars Still Present
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET still in FlowSystemProp enum and system-validator
- Need removal in a later iteration (along with any server-side Stripe billing routes if they exist)
