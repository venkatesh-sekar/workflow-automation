import { AIProviderModel, AIProviderName, isNil } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';

type Provider = 'openai';

type AIModelType = 'text' | 'image';

const OPENAI_MODELS = ['gpt-5.2', 'gpt-5.1', 'gpt-5-mini'] as const;

const ALLOWED_MODELS_BY_PROVIDER: Partial<Record<Provider, readonly string[]>> =
  {
    openai: OPENAI_MODELS,
  };

function getAllowedModelsForProvider(
  provider: Provider,
  allModels: AIProviderModel[],
  modelType: AIModelType,
): AIProviderModel[] {
  const allowedIds = ALLOWED_MODELS_BY_PROVIDER[provider];

  return allModels
    .filter((model) => model.type === modelType)
    .filter((model) => {
      if (isNil(allowedIds)) {
        return true;
      }

      return allowedIds.includes(model.id);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const aiModelHooks = {
  useListProviders: () => {
    return useQuery({
      queryKey: ['ai-providers'],
      queryFn: () => aiProviderApi.list(),
    });
  },

  useGetModelsForProvider: (provider?: Provider) => {
    return useQuery({
      queryKey: ['ai-models', provider],
      enabled: !!provider,
      queryFn: async () => {
        if (isNil(provider)) return [];

        const allModels = await aiProviderApi.listModelsForProvider(provider);

        return getAllowedModelsForProvider(provider, allModels, 'text');
      },
    });
  },
};
