import { AIProviderAuthConfig, AIProviderConfig, AIProviderName } from '@flow/shared'
import { AIProviderStrategy } from './ai-provider'
import { openaiProvider } from './openai-provider'

export const aiProviders: Partial<Record<AIProviderName, AIProviderStrategy<AIProviderAuthConfig, AIProviderConfig>>> = {
    [AIProviderName.OPENAI]: openaiProvider,
}

export { AIProviderStrategy } from './ai-provider'
