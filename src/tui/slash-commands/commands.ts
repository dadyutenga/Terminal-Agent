import type { CommandExecuteArgs, SlashCommand } from './types.js';

const formatStatus = (args: CommandExecuteArgs) => {
  const status = args.context.git.status();
  const changeSummary =
    status.changes.length > 0
      ? status.changes.map((change) => `  • ${change}`).join('\n')
      : '  • No local changes';

  return [
    `Git status for ${args.context.config.projectRoot}:`,
    `  • Branch: ${status.branch}`,
    `  • Ahead: ${status.ahead}, Behind: ${status.behind}`,
    changeSummary,
  ].join('\n');
};

export const createSlashCommands = (helpers: Omit<CommandExecuteArgs, 'args' | 'rawInput'>): SlashCommand[] => {
  const commands: SlashCommand[] = [];

  const helpCommand: SlashCommand = {
    id: 'help',
    name: 'help',
    description: 'Show the list of available slash commands.',
    run: () => {
      const lines = commands.map((command) => `/${command.name} – ${command.description}`);
      helpers.appendMessage({
        role: 'system',
        content: ['Available commands:', ...lines].join('\n'),
        timestamp: Date.now(),
      });
    },
  };

  const clearCommand: SlashCommand = {
    id: 'clear',
    name: 'clear',
    description: 'Clear the chat history for this session.',
    run: () => {
      helpers.context.memory.clear();
      helpers.setMessages([]);
      helpers.appendMessage({
        role: 'system',
        content: 'Chat history cleared.',
        timestamp: Date.now(),
      });
    },
  };

  const gitStatusCommand: SlashCommand = {
    id: 'git-status',
    name: 'git-status',
    description: 'Display the current git branch and pending changes.',
    aliases: ['status'],
    keywords: ['branch', 'changes'],
    run: () => {
      const summary = formatStatus({ ...helpers, args: [], rawInput: '' });
      helpers.appendMessage({
        role: 'system',
        content: summary,
        timestamp: Date.now(),
      });
    },
  };

  const reindexCommand: SlashCommand = {
    id: 'reindex',
    name: 'reindex',
    description: 'Rebuild the project code index from disk.',
    keywords: ['index', 'search'],
    run: async ({ setStatus }) => {
      setStatus('Reindexing project...');
      await helpers.context.indexer.indexProject();
      helpers.appendMessage({
        role: 'system',
        content: 'Code index refreshed.',
        timestamp: Date.now(),
      });
    },
  };

  const configCommand: SlashCommand = {
    id: 'show-config',
    name: 'show-config',
    description: 'Print the active ASIA configuration.',
    aliases: ['config'],
    run: () => {
      const { projectRoot, databasePath } = helpers.context.config;
      helpers.appendMessage({
        role: 'system',
        content: [`Project root: ${projectRoot}`, `Database: ${databasePath}`].join('\n'),
        timestamp: Date.now(),
      });
    },
  };

  commands.push(helpCommand, clearCommand, gitStatusCommand, reindexCommand, configCommand);

  return commands;
};
