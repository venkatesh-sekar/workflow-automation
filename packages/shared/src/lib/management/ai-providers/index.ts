import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'

export enum AIProviderName {
    OPENAI = 'openai',
}


export enum AIProviderModelType {
    IMAGE = 'image',
    TEXT = 'text',
}

export const BaseAIProviderAuthConfig = z.object({
    apiKey: z.string(),
})
export type BaseAIProviderAuthConfig = z.infer<typeof BaseAIProviderAuthConfig>

export const OpenAIProviderAuthConfig = BaseAIProviderAuthConfig
export type OpenAIProviderAuthConfig = z.infer<typeof OpenAIProviderAuthConfig>

export const OpenAIProviderConfig = z.object({})
export type OpenAIProviderConfig = z.infer<typeof OpenAIProviderConfig>

export const ProviderModelConfig = z.object({
    modelId: z.string(),
    modelName: z.string(),
    modelType: z.nativeEnum(AIProviderModelType),
})
export type ProviderModelConfig = z.infer<typeof ProviderModelConfig>

export const AIProviderAuthConfig = OpenAIProviderAuthConfig
export type AIProviderAuthConfig = z.infer<typeof AIProviderAuthConfig>

export const AIProviderConfig = OpenAIProviderConfig
export type AIProviderConfig = z.infer<typeof AIProviderConfig>

const ProviderConfigUnion = z.discriminatedUnion('provider', [
    z.object({
        displayName: z.string().min(1),
        provider: z.literal(AIProviderName.OPENAI),
        config: OpenAIProviderConfig,
        auth: OpenAIProviderAuthConfig,
    }),
])

export const AIProvider = z.object({
    ...BaseModelSchema,
    displayName: z.string().min(1),
    platformId: z.string(),
}).and(ProviderConfigUnion)

export type AIProvider = z.infer<typeof AIProvider>

export const AIProviderWithoutSensitiveData = z.object({
    id: z.string(),
    name: z.string(),
    provider: z.nativeEnum(AIProviderName),
    config: AIProviderConfig,
})
export type AIProviderWithoutSensitiveData = z.infer<typeof AIProviderWithoutSensitiveData>

export const AIProviderModel = z.object({
    id: z.string(),
    name: z.string(),
    type: z.nativeEnum(AIProviderModelType),
})
export type AIProviderModel = z.infer<typeof AIProviderModel>

export const CreateAIProviderRequest = ProviderConfigUnion
export type CreateAIProviderRequest = z.infer<typeof CreateAIProviderRequest>


export const UpdateAIProviderRequest = z.object({
    displayName: z.string().min(1),
    config: AIProviderConfig.optional(),
    auth: AIProviderAuthConfig.optional(),
})
export type UpdateAIProviderRequest = z.infer<typeof UpdateAIProviderRequest>


export const GetProviderConfigResponse = z.object({
    provider: z.nativeEnum(AIProviderName),
    config: AIProviderConfig,
    auth: AIProviderAuthConfig,
})
export type GetProviderConfigResponse = z.infer<typeof GetProviderConfigResponse>


export const AIErrorResponse = z.object({
    error: z.object({
        message: z.string(),
        type: z.string(),
        code: z.string(),
    }),
})

export type AIErrorResponse = z.infer<typeof AIErrorResponse>
