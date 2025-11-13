import { TermiMindConfig } from '../config/index.js';
import { IntentParser } from '../intents/intent-parser.js';
import { CodeIndexer } from '../indexing/code-indexer.js';
import { GitManager } from '../git/git-manager.js';
import { LlmGateway } from '../llm/llm-gateway.js';
import { PatchEngine } from '../patches/patch-engine.js';
import { CommandExecutor } from '../executor/command-executor.js';
import { SessionMemory } from '../memory/session-memory.js';

export type RuntimeContext = {
  config: TermiMindConfig;
  intents: IntentParser;
  indexer: CodeIndexer;
  git: GitManager;
  llm: LlmGateway;
  patches: PatchEngine;
  executor: CommandExecutor;
  memory: SessionMemory;
};

export const createRuntimeContext = async (config: TermiMindConfig): Promise<RuntimeContext> => {
  const intents = new IntentParser();
  const indexer = new CodeIndexer(config);
  const git = new GitManager(config.projectRoot);
  const llm = new LlmGateway(config.llm);
  const patches = new PatchEngine(config.projectRoot);
  const executor = new CommandExecutor(config.projectRoot);
  const memory = new SessionMemory();

  await indexer.initialize();
  indexer.indexProject();

  return {
    config,
    intents,
    indexer,
    git,
    llm,
    patches,
    executor,
    memory,
  };
};
