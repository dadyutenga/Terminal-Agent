import type { AiChatOptions, AiProvider, AiProviderConfig, AiResponse, ChatMessage } from '../types.js';

const stripTrailingSlash = (value?: string) => value?.replace(/\/+$/, '') ?? '';

export class OllamaProvider implements AiProvider {
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly temperature?: number;

  constructor(config: AiProviderConfig) {
    this.baseUrl = stripTrailingSlash(config.baseUrl) || 'http://127.0.0.1:11434';
    this.defaultModel = config.model;
    this.temperature = config.temperature;
  }

  async chat(messages: ChatMessage[], options: AiChatOptions = {}): Promise<AiResponse> {
    const model = options.model ?? this.defaultModel;
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        stream: false,
        options: {
          temperature: options.temperature ?? this.temperature,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText} - ${detail}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
      response?: string;
      total_duration?: number;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const content = data.message?.content ?? data.response ?? '';

    return {
      content,
      model,
      usage: {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
      },
      raw: data,
    };
  }
}
