import { AIProviderName } from '@flow/shared';
export const SUPPORTED_AI_PROVIDERS: AiProviderInfo[] = [
  {
    provider: AIProviderName.OPENAI,
    name: 'OpenAI',
    markdown: `Follow these instructions to get your OpenAI API Key:

1. Go to https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`,
    logoUrl: '',
  },
];

export type AiProviderInfo = {
  provider: AIProviderName;
  name: string;
  markdown: string;
  logoUrl: string;
};
