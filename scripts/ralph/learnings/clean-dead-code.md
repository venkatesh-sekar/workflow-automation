# Clean Dead Code Phase Learnings

## Criteria Assessment
- sign-up-form.tsx + auth-form-template.tsx: NOT dead — actively used by /login and /signup routes. Update criteria.
- features/alerts/: Confirmed dead — zero imports anywhere. Removed.
- git-sync: NOT dead — part of active project-releases feature. Update criteria.
- use-partner-stack.ts: Still imported by verify-email.tsx — check if PartnerStack service is dead.
- TemplateType.OFFICIAL/SHARED: No UI refs found — already clean or never existed in web.
- isCloud checks: Only isCloudPlanButNotEnterprise in delete-account.tsx — check if dead.
- user-badges.tsx: Still imported by flow-avatar.tsx and account-settings — check CDN refs inside.
