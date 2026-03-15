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
- active-flows-addon deleted (3 files: component, purchase dialog, store)
- PurchaseExtraFlowsDialog removed from 3 layouts (all were gated by FlowEdition.CLOUD)
- useManagePlanDialogStore removed from app.tsx (QUOTA_EXCEEDED → openDialog logic removed)
- Billing page simplified: removed ActiveFlowAddon, SubscriptionInfo, Stripe portal button, support@activepieces.com
- SubscriptionInfo component + PRICE_PER_EXTRA_ACTIVE_FLOWS now dead exports — clean up later
- ai-credits components deleted (3 files + enable-ai-credits-overage.tsx), billingMutations removed entirely
- SubscriptionInfo component is dead (no imports) — clean up later or in dead-code phase
- success.tsx still references ai-credit action types (ai-credit-auto-topup, ai-credit-payment) — harmless but could clean
- Billing page still fetches platformPlanInfo via billingQueries but doesn't use it in render (only LicenseKey with platform is shown) — dead query, clean later
- piece-sync-service.ts gutted: removed cloud.activepieces.com URL, listCloudPieces, installNewPieces, deletePiecesIfNotOnCloud — sync() is now a no-op log message when OFFICIAL_AUTO mode
- Removed unused imports: semver, groupBy, PackageType, PieceType, apVersionUtil, PieceMetadata, PieceMetadataSchema, pieceRepos
- cloud-oauth2-service.ts gutted to throw errors (no secrets.activepieces.com dependency)
- Frontend still has secrets.activepieces.com refs in oauth2-connection-settings.tsx and oauth-apps.ts — will be handled in strip-external-urls phase
- community-templates.service.ts gutted: no imports of communityTemplates found anywhere — dead code, but kept methods as stubs
- AppSumo removed: APPSUMO_PLAN was dead code (never imported), PlanName tiers only in platform.model.ts, APPSUMO_TOKEN only in system-props + validator + .env.tests
- Firebase Scrypt removed: password-hasher.ts simplified to bcrypt-only, scrypt test describe block removed
- Next targets: Cloudflare, Featurebase, SCIM
