import type { AiChatOptions, AiProvider, AiProviderConfig, AiResponse, ChatMessage } from '../types.js';

type GeminiContentPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiContentPart[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

const roleMap: Record<'user' | 'assistant', 'user' | 'model'> = {
  user: 'user',
  assistant: 'model',
};

const stripTrailingSlash = (value?: string) => value?.replace(/\/+$/, '') ?? '';

export class GeminiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly temperature?: number;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini provider requires an API key.');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = stripTrailingSlash(config.baseUrl) || 'https://generativelanguage.googleapis.com';
    this.defaultModel = config.model;
    this.temperature = config.temperature;
  }

  async chat(messages: ChatMessage[], options: AiChatOptions = {}): Promise<AiResponse> {
    const systemInstruction = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content.trim())
      .filter(Boolean)
      .join('\n\n');

    const conversation = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: roleMap[message.role as 'user' | 'assistant'] ?? 'user',
        parts: [{ text: message.content }],
      }));

    const model = options.model ?? this.defaultModel;
    const url = `${this.baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const body: Record<string, unknown> = {
      contents: conversation,
      generationConfig: {
        temperature: options.temperature ?? this.temperature,
        maxOutputTokens: options.maxOutputTokens,
        topP: options.topP,
      },
    };

    if (systemInstruction) {
      body.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${response.statusText} - ${detail}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

    return {
      content: text,
      model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      },
      raw: data,
    };
  }
}
