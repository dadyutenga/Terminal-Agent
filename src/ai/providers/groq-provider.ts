import type { AiChatOptions, AiProvider, AiProviderConfig, AiResponse, ChatMessage } from '../types.js';

const stripTrailingSlash = (value?: string) => value?.replace(/\/+$/, '') ?? '';

export class GroqProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly temperature?: number;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Groq provider requires an API key.');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = stripTrailingSlash(config.baseUrl) || 'https://api.groq.com/openai/v1';
    this.defaultModel = config.model;
    this.temperature = config.temperature;
  }

  async chat(messages: ChatMessage[], options: AiChatOptions = {}): Promise<AiResponse> {
    const model = options.model ?? this.defaultModel;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: options.temperature ?? this.temperature,
        max_tokens: options.maxOutputTokens,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${response.statusText} - ${detail}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    return {
      content: data.choices?.[0]?.message?.content ?? '',
      model,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
      raw: data,
    };
  }
}
