import OpenAI from 'openai';
import type { ChatMessage, LlmProvider, LlmResponse } from '../types.js';

export type OpenAiProviderOptions = {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
};

export class OpenAiProvider implements LlmProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: OpenAiProviderOptions) {
    if (!options.apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider');
    }
    this.client = new OpenAI({ apiKey: options.apiKey, baseURL: options.baseUrl });
    this.model = options.model ?? 'gpt-4o-mini';
  }

  async chat(messages: ChatMessage[]): Promise<LlmResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(({ role, content }) => ({ role, content })),
    });

    const choice = response.choices[0];
    return {
      content: choice.message?.content ?? '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      },
    };
  }
}
