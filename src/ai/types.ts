export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AiUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
};

export type AiResponse = {
  content: string;
  model?: string;
  usage?: AiUsage;
  raw?: unknown;
};

export type AiChatOptions = {
  model?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  [key: string]: unknown;
};

export interface AiProvider {
  chat(messages: ChatMessage[], options?: AiChatOptions): Promise<AiResponse>;
}

export type ProviderId =
  | 'openai'
  | 'gemini'
  | 'anthropic'
  | 'kimi'
  | 'groq'
  | 'ollama';

export type AiProviderConfig = {
  apiKey?: string;
  model: string;
  baseUrl?: string;
  organization?: string;
  temperature?: number;
  extra?: Record<string, unknown>;
};

export type AiManagerConfig = {
  provider: ProviderId | 'llama';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  temperature?: number;
  extra?: Record<string, unknown>;
};

export type ProviderFactory = (config: AiProviderConfig) => AiProvider;

export type ProviderRegistration = {
  id: ProviderId;
  label: string;
  requiresApiKey: boolean;
  defaultModel: string;
  models: readonly string[];
  create: ProviderFactory;
};

export class UnknownProviderError extends Error {
  constructor(provider: string) {
    super(`Unsupported AI provider: ${provider}`);
    this.name = 'UnknownProviderError';
  }
}

export class MissingApiKeyError extends Error {
  constructor(provider: string) {
    super(`Missing API key for provider: ${provider}`);
    this.name = 'MissingApiKeyError';
  }
}
