# Phase: clean-strings-and-comments

## Learnings
- Translation JSON files have key=English string, value=translated string — need to replace in BOTH keys and values
- Non-English locales had "Activepieces" in translated values that weren't caught by targeted sed patterns — broad replacement needed
- x-activepieces-resume-webhook-url is an HTTP header in webhook piece — renamed to x-flow-resume-webhook-url in i18n, need to also rename the actual header in server code (for later iteration)
- AP_FRONTEND_URL env var name preserved (not renamed in this phase — separate concern)
- crowdin.yml doesn't exist — criterion already met
