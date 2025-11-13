import fetch from 'node-fetch';
import type { ChatMessage, LlmProvider, LlmResponse } from '../types.js';

export type LlamaProviderOptions = {
  baseUrl?: string;
  model?: string;
};

export class LlamaProvider implements LlmProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: LlamaProviderOptions) {
    this.baseUrl = options.baseUrl ?? 'http://localhost:11434';
    this.model = options.model ?? 'llama3';
  }

  async chat(messages: ChatMessage[]): Promise<LlmResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages }),
    });

    if (!response.ok) {
      throw new Error(`Llama provider error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return {
      content: data.message?.content ?? '',
      model: this.model,
    };
  }
}
