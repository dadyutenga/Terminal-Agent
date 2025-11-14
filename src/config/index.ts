import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AiManagerConfig } from '../ai/types.js';

loadEnv();

export type ASIATConfig = {
  projectRoot: string;
  databasePath: string;
  llm: AiManagerConfig;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultConfig: ASIATConfig = {
  projectRoot: process.cwd(),
  databasePath: path.join(__dirname, '../../data/index.db'),
  llm: {
    provider: (process.env.ASIAT_LLM_PROVIDER as AiManagerConfig['provider']) ?? 'openai',
    apiKey:
      process.env.ASIAT_LLM_API_KEY ??
      process.env.OPENAI_API_KEY ??
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      process.env.ANTHROPIC_API_KEY ??
      process.env.KIMI_API_KEY ??
      process.env.MOONSHOT_API_KEY ??
      process.env.GROQ_API_KEY,
    model: process.env.ASIAT_LLM_MODEL ?? 'gpt-4.1-mini',
    baseUrl: process.env.ASIAT_LLM_BASE_URL,
    organization: process.env.ASIAT_LLM_ORGANIZATION,
    temperature:
      process.env.ASIAT_LLM_TEMPERATURE && !Number.isNaN(Number(process.env.ASIAT_LLM_TEMPERATURE))
        ? Number(process.env.ASIAT_LLM_TEMPERATURE)
        : undefined,
  },
};

export const loadConfig = (overrides?: Partial<ASIATConfig>): ASIATConfig => {
  return {
    ...defaultConfig,
    ...overrides,
    llm: {
      ...defaultConfig.llm,
      ...overrides?.llm,
    },
  };
};
