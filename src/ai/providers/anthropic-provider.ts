import type { AiChatOptions, AiProvider, AiProviderConfig, AiResponse, ChatMessage } from '../types.js';

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: Array<{ type: 'text'; text: string }>;
};

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

const stripTrailingSlash = (value?: string) => value?.replace(/\/+$/, '') ?? '';

export class AnthropicProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly temperature?: number;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic provider requires an API key.');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = stripTrailingSlash(config.baseUrl) || 'https://api.anthropic.com';
    this.defaultModel = config.model;
    this.temperature = config.temperature;
  }

  async chat(messages: ChatMessage[], options: AiChatOptions = {}): Promise<AiResponse> {
    const systemPrompt = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content.trim())
      .filter(Boolean)
      .join('\n\n');

    const formattedMessages: AnthropicMessage[] = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: [{ type: 'text', text: message.content }],
      }));

    const model = options.model ?? this.defaultModel;
    const url = `${this.baseUrl}/v1/messages`;
    const body = {
      model,
      system: systemPrompt || undefined,
      messages: formattedMessages,
      max_tokens: options.maxOutputTokens ?? 1024,
      temperature: options.temperature ?? this.temperature,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Anthropic request failed: ${response.status} ${response.statusText} - ${detail}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const text = data.content?.map((entry) => entry.text ?? '').join('') ?? '';

    return {
      content: text,
      model,
      usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
      },
      raw: data,
    };
  }
}
