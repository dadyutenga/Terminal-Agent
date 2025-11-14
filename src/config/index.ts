import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnv();

export type ASIATConfig = {
  projectRoot: string;
  databasePath: string;
  llm: {
    provider: 'openai' | 'llama';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultConfig: ASIATConfig = {
  projectRoot: process.cwd(),
  databasePath: path.join(__dirname, '../../data/index.db'),
  llm: {
    provider: process.env.ASIAT_LLM_PROVIDER === 'llama' ? 'llama' : 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.ASIAT_LLM_MODEL ?? 'gpt-4o-mini',
    baseUrl: process.env.ASIAT_LLM_BASE_URL,
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
