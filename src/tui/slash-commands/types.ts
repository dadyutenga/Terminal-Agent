import type { Dispatch, SetStateAction } from 'react';
import type { RuntimeContext } from '../../services/context.js';
import type { MemoryEntry } from '../../memory/session-memory.js';

export type CommandExecuteArgs = {
  context: RuntimeContext;
  appendMessage: (entry: MemoryEntry) => void;
  setMessages: Dispatch<SetStateAction<MemoryEntry[]>>;
  setStatus: (status: string) => void;
  args: string[];
  rawInput: string;
};

export type SlashCommand = {
  id: string;
  name: string;
  description: string;
  aliases?: string[];
  keywords?: string[];
  run: (args: CommandExecuteArgs) => Promise<void> | void;
  preserveStatus?: boolean;
};
