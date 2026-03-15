import { createOpenAI, openai } from '@ai-sdk/openai'
import { ImageModel, LanguageModel } from 'ai'
import { httpClient, HttpMethod } from '@flow/pieces-common'
import { AIProviderName, GetProviderConfigResponse } from '@flow/shared'

type CreateAIModelParams<IsImage extends boolean = false> = {
    provider: AIProviderName;
    modelId: string;
    engineToken: string;
    projectId: string;
    flowId: string;
    runId: string;
    apiUrl: string;
    openaiResponsesModel?: boolean;
    isImage?: IsImage;
}

export function createAIModel(params: CreateAIModelParams<false>): Promise<LanguageModel>;
export function createAIModel(params: CreateAIModelParams<true>): Promise<ImageModel>;
export async function createAIModel({
    provider,
    modelId,
    engineToken,
    projectId,
    flowId,
    runId,
    apiUrl,
    openaiResponsesModel = false,
    isImage,
}: CreateAIModelParams<boolean>): Promise<ImageModel | LanguageModel> {
    const { body: {
        config,
        auth,
    } } = await httpClient.sendRequest<GetProviderConfigResponse>({
        method: HttpMethod.GET,
        url: `${apiUrl}v1/ai-providers/${provider}/config`,
        headers: {
            Authorization: `Bearer ${engineToken}`,
        },
    });

    switch (provider) {
        case AIProviderName.OPENAI: {
            const provider = createOpenAI({ apiKey: auth.apiKey })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return (openaiResponsesModel ? provider.responses(modelId) : provider.chat(modelId))
        }
        default:
            throw new Error(`Provider ${provider} is not supported. Only OpenAI is supported.`)
    }
}

export const openaiSearchTool = openai.tools.webSearchPreview;
