import type { ChatMessage, LlmProvider, LlmResponse } from '../types.js';

export class FallbackProvider implements LlmProvider {
  async chat(messages: ChatMessage[]): Promise<LlmResponse> {
    const last = messages[messages.length - 1];
    return {
      content:
        'LLM provider is not configured. Please set OPENAI_API_KEY or provide a TERMIMIND_LLM_BASE_URL for a local model. Last prompt was:\n' +
        (last?.content ?? ''),
      model: 'fallback',
    };
  }
}
