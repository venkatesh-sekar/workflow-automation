import {
  createAction,
  InputPropertyMap,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { ModelMessage, ToolSet, generateText, stepCountIs } from 'ai';
import { spreadIfDefined, AIProviderName } from '@activepieces/shared';
import { aiProps } from '../../common/props';
import { openaiSearchTool, createAIModel } from '../../common/ai-sdk';

export const askAI = createAction({
  name: 'askAi',
  displayName: 'Ask AI',
  description: 'A flexible AI step. ask it to analyze data, explain, draft, or decide based on your flow\'s data.',
  props: {
    provider: aiProps({ modelType: 'text' }).provider,
    model: aiProps({ modelType: 'text' }).model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    conversationKey: Property.ShortText({
      displayName: 'Conversation Key',
      required: false,
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      required: false,
      defaultValue: 100,
      description:
        'Controls the creativity of the AI response. A higher value will make the AI more creative and a lower value will make it more deterministic.',
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
    webSearch: Property.Checkbox({
      displayName: 'Web Search',
      required: false,
      defaultValue: false,
      description:
        'Whether to use web search to find information for the AI to use in its response.',
    }),
    webSearchOptions: Property.DynamicProperties({
      displayName: 'Web Search Options',
      required: false,
      auth: PieceAuth.None(),
      refreshers: ['webSearch', 'provider', 'model'],
      props: async (propsValue) => {
        const webSearchEnabled = propsValue['webSearch'] as unknown as boolean;
        const provider = propsValue['provider'] as unknown as string;

        if (!webSearchEnabled) {
          return {};
        }

        let options: InputPropertyMap = {
          maxUses: Property.Number({
            displayName: 'Max Web Search Uses',
            required: false,
            defaultValue: 5,
            description: 'Maximum number of searches to use. Default is 5.',
          }),
        };

        if (provider === AIProviderName.OPENAI) {
          options = {
            ...options,
            includeSources: Property.Checkbox({
              displayName: 'Include Sources',
              description:
                'Whether to include the sources in the response. Useful for getting web search details (e.g. search queries, searched URLs, etc).',
              required: false,
              defaultValue: false,
            }),
            searchContextSize: Property.StaticDropdown({
              displayName: 'Search Context Size',
              required: false,
              defaultValue: 'medium',
              options: {
                options: [
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ],
              },
              description:
                'High level guidance for the amount of context window space to use for the search.',
            }),
            userLocationCity: Property.ShortText({
              displayName: 'User Location - City',
              required: false,
              description:
                'The city name for localizing search results (e.g., San Francisco).',
            }),
            userLocationRegion: Property.ShortText({
              displayName: 'User Location - Region',
              required: false,
              description:
                'The region or state for localizing search results (e.g., California).',
            }),
            userLocationCountry: Property.ShortText({
              displayName: 'User Location - Country',
              required: false,
              description:
                'The country code for localizing search results (e.g., US).',
            }),
            userLocationTimezone: Property.ShortText({
              displayName: 'User Location - Timezone',
              required: false,
              description:
                'The IANA timezone ID for localizing search results (e.g., America/Los_Angeles).',
            }),
          };
        }

        return options;
      },
    }),
  },
  async run(context) {
    const provider = context.propsValue.provider;
    const modelId = context.propsValue.model;
    const storage = context.store;
    const webSearchOptions = context.propsValue.webSearchOptions as WebSearchOptions;

    const model = await createAIModel({
      provider: provider as AIProviderName,
      modelId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
      openaiResponsesModel: true,
    });

    const conversationKey = context.propsValue.conversationKey
      ? `ask-ai-conversation:${context.propsValue.conversationKey}`
      : null;

    let conversation = null;
    if (conversationKey) {
      conversation = (await storage.get<ModelMessage[]>(conversationKey)) ?? [];
      if (!conversation) {
        await storage.put(conversationKey, { messages: [] });
      }
    }

    const tools = !context.propsValue.webSearch
      ? undefined
      : createWebSearchTool(provider, webSearchOptions);

    const stopWhen = tools
      ? stepCountIs(webSearchOptions?.maxUses ?? 5)
      : undefined;

    const response = await generateText({
      model,
      messages: [
        ...(conversation ?? []),
        {
          role: 'user',
          content: context.propsValue.prompt,
        },
      ],
      maxOutputTokens: context.propsValue.maxOutputTokens,
      temperature: (context.propsValue.creativity ?? 100) / 100,
      tools,
      stopWhen,
    });

    conversation?.push({
      role: 'user',
      content: context.propsValue.prompt,
    });

    conversation?.push({
      role: 'assistant',
      content: response.text ?? '',
    });

    if (conversationKey) {
      await storage.put(conversationKey, conversation);
    }

    const includeSources = webSearchOptions?.includeSources;
    if (includeSources) {
      return { text: response.text, sources: response.sources };
    }
    return response.text;
  },
});

export function createWebSearchTool(
  provider: string,
  options: WebSearchOptions = {}
): ToolSet {
  switch (provider) {
    case AIProviderName.OPENAI: {
      const openaiOptions = options as OpenAIWebSearchOptions;

      return {
        web_search_preview: openaiSearchTool({
          ...spreadIfDefined(
            'searchContextSize',
            openaiOptions.searchContextSize
          ),
          ...spreadIfDefined('userLocation', buildUserLocation(openaiOptions)),
        }),
      } as any;
    }

    default:
      throw new Error(`Provider ${provider} is not supported for web search. Only OpenAI is supported.`);
  }
}

function buildUserLocation(
  options: UserLocationOptions
): (UserLocationOptions & { type: 'approximate' }) | undefined {
  if (
    !options.userLocationCity &&
    !options.userLocationRegion &&
    !options.userLocationCountry &&
    !options.userLocationTimezone
  ) {
    return undefined;
  }

  return {
    type: 'approximate' as const,
    ...spreadIfDefined('city', options.userLocationCity),
    ...spreadIfDefined('region', options.userLocationRegion),
    ...spreadIfDefined('country', options.userLocationCountry),
    ...spreadIfDefined('timezone', options.userLocationTimezone),
  };
}

type BaseWebSearchOptions = {
  maxUses?: number
  includeSources?: boolean
}

type UserLocationOptions = {
  userLocationCity?: string
  userLocationRegion?: string
  userLocationCountry?: string
  userLocationTimezone?: string
}

type OpenAIWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
  searchContextSize?: 'low' | 'medium' | 'high'
}

export type WebSearchOptions = OpenAIWebSearchOptions
