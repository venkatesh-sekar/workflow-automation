# Phase: clean-strings-and-comments

## Learnings
- Translation JSON files have key=English string, value=translated string — need to replace in BOTH keys and values
- Non-English locales had "Activepieces" in translated values that weren't caught by targeted sed patterns — broad replacement needed
- x-activepieces-resume-webhook-url header renamed to x-flow-resume-webhook-url in both i18n AND webhook piece source
- JWT issuer changed from 'activepieces' to 'flow' — test helpers updated to match; existing tokens will be invalid after deploy
- migrate-v9-ai-pieces.ts has `provider: 'activepieces'` — left untouched (runtime flow data migration, changing would break existing flows)
- Remaining: embed typings (ActivepiecesClient*/ActivepiecesVendor* types in typings.d.ts + embed/index.tsx consumers), flags.test.ts "not contain Activepieces" assertion (keep — it's a valid test)
- AP_FRONTEND_URL env var name preserved (not renamed in this phase — separate concern)
- crowdin.yml doesn't exist — criterion already met
