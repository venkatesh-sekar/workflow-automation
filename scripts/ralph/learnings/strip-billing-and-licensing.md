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

## License Key / Trial Removal
- verifyLicenseKey was in platforms-api.ts, useUpdateLisenceKey hook in platform-hooks.ts
- request-trial-api.ts sent to sales.activepieces.com — deleted
- Shared license-keys types (VerifyLicenseKeyRequestBody, CreateTrialLicenseKeyRequestBody, LicenseKeyEntity) deleted
- activate-license-dialog.tsx and license-key.tsx still reference useUpdateLisenceKey — need to remove those UI components next
- PlatformPlan still has licenseKey and licenseExpiresAt fields — need cleanup
- flagsHooks import was unused in platform-hooks.ts after removing useUpdateLisenceKey — cleaned up

## Request Trial / Contact Sales Removal
- request-trial.tsx sent users to activepieces.com/sales with query params — deleted
- FeatureKey type moved to locked-feature-guard.tsx (only consumer of the type)
- 15 LockedFeatureGuard consumers passed featureKey prop — all cleaned via sed
- LockedAlert.button made optional since no "Contact Sales" button exists anymore
- activate-license-dialog.tsx deleted, license-key.tsx simplified to FeatureStatus-only display
- Next billing UI targets: active-flows-addon (purchase dialog + component), ai-credit-usage, billing page cleanup (remove stripe portal link, subscription info, simplify)
