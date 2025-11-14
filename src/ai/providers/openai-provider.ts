import OpenAI from 'openai';
import type { AiChatOptions, AiProvider, AiProviderConfig, AiResponse, ChatMessage } from '../types.js';

const mapMessage = ({ role, content }: ChatMessage) => ({ role, content });

export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly temperature?: number;

  constructor(private readonly config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI provider requires an API key.');
    }

    this.client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl, organization: config.organization });
    this.defaultModel = config.model;
    this.temperature = config.temperature;
  }

  async chat(messages: ChatMessage[], options: AiChatOptions = {}): Promise<AiResponse> {
    const model = options.model ?? this.defaultModel;

    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map(mapMessage),
      temperature: options.temperature ?? this.temperature,
      top_p: options.topP,
      max_tokens: options.maxOutputTokens,
    });

    const choice = response.choices[0];
    return {
      content: choice.message?.content ?? '',
      model: response.model ?? model,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
      raw: response,
    };
  }
}
