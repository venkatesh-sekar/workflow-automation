# Phase: clean-strings-and-comments

## Learnings
- Translation JSON files have key=English string, value=translated string — need to replace in BOTH keys and values
- Non-English locales had "Activepieces" in translated values that weren't caught by targeted sed patterns — broad replacement needed
- x-activepieces-resume-webhook-url header renamed to x-flow-resume-webhook-url in both i18n AND webhook piece source
- JWT issuer changed from 'activepieces' to 'flow' — test helpers updated to match; existing tokens will be invalid after deploy
- migrate-v9-ai-pieces.ts has `provider: 'activepieces'` — left untouched (runtime flow data migration, changing would break existing flows)
- Remaining web-side: embed typings (ActivepiecesClient* types in typings.d.ts), auth-form-template cloud check, sign-up-form strings, help-and-feedback links, mcp-credentials UI, platform-pieces-hooks toast, connect-git-dialog placeholders
- AP_FRONTEND_URL env var name preserved (not renamed in this phase — separate concern)
- crowdin.yml doesn't exist — criterion already met
