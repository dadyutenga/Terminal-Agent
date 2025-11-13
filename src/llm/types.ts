export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmResponse = {
  content: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
};

export interface LlmProvider {
  chat(messages: ChatMessage[]): Promise<LlmResponse>;
}
