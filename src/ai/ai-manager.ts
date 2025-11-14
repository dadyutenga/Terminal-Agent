import { AnthropicProvider } from './providers/anthropic-provider.js';
import { GeminiProvider } from './providers/gemini-provider.js';
import { GroqProvider } from './providers/groq-provider.js';
import { KimiProvider } from './providers/kimi-provider.js';
import { OllamaProvider } from './providers/ollama-provider.js';
import { OpenAiProvider } from './providers/openai-provider.js';
import type {
  AiChatOptions,
  AiManagerConfig,
  AiProvider,
  AiProviderConfig,
  AiResponse,
  ChatMessage,
  ProviderId,
  ProviderRegistration,
} from './types.js';
import { MissingApiKeyError, UnknownProviderError } from './types.js';

type NormalizedConfig = AiManagerConfig & { provider: ProviderId };

const stripTrailingSlash = (value?: string) => value?.replace(/\/+$/, '') ?? undefined;

const PROVIDER_REGISTRY: Record<ProviderId, ProviderRegistration> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    requiresApiKey: true,
    defaultModel: 'gpt-4.1-mini',
    models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-5'],
    create: (config) => new OpenAiProvider(config),
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    requiresApiKey: true,
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.0-pro'],
    create: (config) => new GeminiProvider(config),
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude',
    requiresApiKey: true,
    defaultModel: 'claude-3.5-sonnet',
    models: ['claude-3.5-sonnet', 'claude-3.5-haiku'],
    create: (config) => new AnthropicProvider(config),
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi / Moonshot',
    requiresApiKey: true,
    defaultModel: 'kimi-2',
    models: ['kimi-2', 'kimi-1.5', 'moonshot-128k'],
    create: (config) => new KimiProvider(config),
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    requiresApiKey: true,
    defaultModel: 'llama-3.1',
    models: ['llama-3.1', 'mixtral'],
    create: (config) => new GroqProvider(config),
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama',
    requiresApiKey: false,
    defaultModel: 'llama3',
    models: ['llama3', 'deepseek-coder', 'qwen2'],
    create: (config) => new OllamaProvider(config),
  },
};

const PROVIDER_ALIASES: Record<string, ProviderId> = {
  llama: 'ollama',
};

const PROVIDER_ENV_KEYS: Partial<Record<ProviderId, string[]>> = {
  openai: ['ASIAT_LLM_API_KEY', 'OPENAI_API_KEY'],
  gemini: ['ASIAT_LLM_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  anthropic: ['ASIAT_LLM_API_KEY', 'ANTHROPIC_API_KEY'],
  kimi: ['ASIAT_LLM_API_KEY', 'KIMI_API_KEY', 'MOONSHOT_API_KEY'],
  groq: ['ASIAT_LLM_API_KEY', 'GROQ_API_KEY'],
};

const normalizeProvider = (provider: AiManagerConfig['provider']): ProviderId => {
  if (provider in PROVIDER_REGISTRY) {
    return provider as ProviderId;
  }
  const alias = PROVIDER_ALIASES[provider];
  if (alias) {
    return alias;
  }
  throw new UnknownProviderError(provider);
};

const resolveModel = (config: NormalizedConfig, registration: ProviderRegistration): string => {
  if (config.model) {
    return config.model;
  }

  return registration.defaultModel;
};

const resolveApiKey = (provider: ProviderId, explicit?: string): string | undefined => {
  if (explicit) {
    return explicit;
  }

  const envKeys = PROVIDER_ENV_KEYS[provider] ?? [];
  for (const key of envKeys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return undefined;
};

const buildProviderConfig = (config: NormalizedConfig, model: string, apiKey?: string): AiProviderConfig => ({
  apiKey,
  model,
  baseUrl: stripTrailingSlash(config.baseUrl),
  organization: config.organization,
  temperature: config.temperature,
  extra: config.extra,
});

export class AiManager {
  private readonly registration: ProviderRegistration;
  private readonly provider: AiProvider;
  private readonly activeConfig: NormalizedConfig & { model: string; apiKey?: string };

  constructor(config: AiManagerConfig) {
    const normalizedProvider = normalizeProvider(config.provider);
    const registration = PROVIDER_REGISTRY[normalizedProvider];
    if (!registration) {
      throw new UnknownProviderError(config.provider);
    }

    const normalizedConfig: NormalizedConfig = { ...config, provider: normalizedProvider };
    const model = resolveModel(normalizedConfig, registration);
    const apiKey = resolveApiKey(normalizedProvider, normalizedConfig.apiKey);

    if (registration.requiresApiKey && !apiKey) {
      throw new MissingApiKeyError(normalizedProvider);
    }

    const providerConfig = buildProviderConfig(normalizedConfig, model, apiKey);

    this.registration = registration;
    this.provider = registration.create(providerConfig);
    this.activeConfig = { ...normalizedConfig, model, apiKey };
  }

  chat(messages: ChatMessage[], options: AiChatOptions = {}): Promise<AiResponse> {
    const model = options.model ?? this.activeConfig.model;
    return this.provider.chat(messages, { ...options, model });
  }

  get providerId(): ProviderId {
    return this.registration.id;
  }

  get model(): string {
    return this.activeConfig.model;
  }

  get availableModels(): readonly string[] {
    return this.registration.models;
  }

  static listProviders(): ProviderRegistration[] {
    return Object.values(PROVIDER_REGISTRY);
  }
}
