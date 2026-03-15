# strip-ai-providers Phase Learnings

## Structure
- Provider implementations: packages/server/api/src/app/ai/providers/
- Provider types/enums: packages/shared/src/lib/management/ai-providers/index.ts
- Provider registry: providers/index.ts maps AIProviderName enum → strategy objects
- Originally 8 providers: OPENAI, ANTHROPIC, OPENROUTER, AZURE, GOOGLE, CLOUDFLARE_GATEWAY, CUSTOM, ACTIVEPIECES
- Now only OPENAI remains

## Completed
1. ✅ Stripped server provider registry + deleted 6 provider files (kept openai-provider.ts, ai-provider.ts base)
2. ✅ Stripped shared types (enum reduced to OPENAI only, removed 7 provider zod schemas/auth configs, removed splitCloudflareGatewayModelId)
3. Still need: check UI references to removed providers, update tests

## Discoveries
- ACTIVEPIECES provider was a cloud credits proxy — removed entirely along with aiCreditsEnabled, enrichWithKeysIfNeeded, AI_CREDIT_UPDATE_CHECK
- Migration files reference removed enum values — use string literals with `as any` for type safety
- ai-provider-service.ts had significant ACTIVEPIECES-specific code (auto-create, enrichment, credit check scheduling) — all removed
- UI file upsert-provider-dialog.tsx imports all removed provider types — needs cleanup next
- Dead references remain: AI_CREDIT_UPDATE_CHECK in system-jobs/common.ts, aiCreditsEnabled in flag.service.ts — cleanup next
