import type { ChatMessage, LlmResponse } from './types.js';
import type { TermiMindConfig } from '../config/index.js';
import { OpenAiProvider } from './providers/openai-provider.js';
import { LlamaProvider } from './providers/llama-provider.js';
import { FallbackProvider } from './providers/fallback-provider.js';
import type { LlmProvider } from './types.js';

export class LlmGateway {
  private readonly provider: LlmProvider;

  constructor(config: TermiMindConfig['llm']) {
    if (config.provider === 'llama') {
      this.provider = new LlamaProvider({ baseUrl: config.baseUrl, model: config.model });
    } else if (config.apiKey) {
      this.provider = new OpenAiProvider({ apiKey: config.apiKey, model: config.model, baseUrl: config.baseUrl });
    } else {
      this.provider = new FallbackProvider();
    }
  }

  chat(messages: ChatMessage[]): Promise<LlmResponse> {
    return this.provider.chat(messages);
  }
}
