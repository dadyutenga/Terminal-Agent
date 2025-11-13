#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig, TermiMindConfig } from '../config/index.js';
import { runTui } from '../tui/index.js';
import { createRuntimeContext } from '../services/context.js';

const ASIAT_LOGO = String.raw`
   ▄▄▄█████▓ ▒█████   ██████  ██▓▄▄▄█████▓
   ▓  ██▒ ▓▒▒██▒  ██▒██    ▒ ▓██▒▓  ██▒ ▓▒
   ▒ ▓██░ ▒░▒██░  ██▒░ ▓██▄   ▒██▒▒ ▓██░ ▒░
   ░ ▓██▓ ░ ▒██   ██░  ▒   ██▒░██░░ ▓██▓ ░ 
     ▒██▒ ░ ░ ████▓▒░▒██████▒▒░██░  ▒██▒ ░ 
     ▒ ░░   ░ ▒░▒░▒░ ▒ ▒▓▒ ▒ ░░▓    ▒ ░░   
       ░      ░ ▒ ▒░ ░ ░▒  ░ ░ ▒ ░    ░    
     ░      ░ ░ ░ ▒  ░  ░  ░   ▒ ░  ░      
                  ░ ░        ░   ░         
          A   S   i   A   T    C L I       
`;

const program = new Command();

program
  .name('asiat')
  .description('ASIAT - TUI agentic coding assistant (ASIAT CLI)')
  .option('-p, --project <path>', 'Path to the project root')
  .option('--db <path>', 'Path to sqlite index database')
  .option('--llm-provider <provider>', 'LLM provider to use (openai|llama)')
  .option('--llm-model <model>', 'LLM model identifier')
  .option('--llm-base-url <url>', 'Custom LLM base URL')
  .action(async (options) => {
    const configOverrides: Partial<TermiMindConfig> = {};
    
    if (options.project) {
      configOverrides.projectRoot = options.project;
    }
    if (options.db) {
      configOverrides.databasePath = options.db;
    }
    if (options.llmProvider || options.llmModel || options.llmBaseUrl) {
      configOverrides.llm = {
        ...(options.llmProvider && { provider: options.llmProvider }),
        ...(options.llmModel && { model: options.llmModel }),
        ...(options.llmBaseUrl && { baseUrl: options.llmBaseUrl }),
      };
    }

    const config = loadConfig(configOverrides);
    const context = await createRuntimeContext(config);
    console.log(ASIAT_LOGO);
    await runTui(context);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error('ASIAT failed to start:', error);
  process.exitCode = 1;
});
