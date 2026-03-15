# strip-ai-providers Phase Learnings

## Structure
- Provider implementations: packages/server/api/src/app/ai/providers/
- Provider types/enums: packages/shared/src/lib/management/ai-providers/index.ts
- Provider registry: providers/index.ts maps AIProviderName enum → strategy objects
- 8 providers total: OPENAI, ANTHROPIC, OPENROUTER, AZURE, GOOGLE, CLOUDFLARE_GATEWAY, CUSTOM, ACTIVEPIECES
- Keep only OPENAI; remove ANTHROPIC, GOOGLE, AZURE, OPENROUTER, CLOUDFLARE_GATEWAY, ACTIVEPIECES, CUSTOM

## Plan
1. Strip server provider registry + delete provider files (keep openai-provider.ts, ai-provider.ts base)
2. Strip shared types (enum, zod schemas, discriminated union)
3. Check for references to removed providers elsewhere in server/UI
4. Update tests
