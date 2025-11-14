import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ChatView } from './components/ChatView.js';
import { InputBar } from './components/InputBar.js';
import { CommandPalette } from './components/CommandPalette.js';
import type { RuntimeContext } from '../services/context.js';
import type { MemoryEntry } from '../memory/session-memory.js';
import { createSlashCommands } from './slash-commands/commands.js';
import type { SlashCommand } from './slash-commands/types.js';

export type ASIATAppProps = {
  context: RuntimeContext;
};

const normalizeCommandToken = (value: string) => value.trim().toLowerCase();

export const ASIATApp: React.FC<ASIATAppProps> = ({ context }) => {
  const [messages, setMessages] = useState<MemoryEntry[]>(context.memory.list());
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string>('Ready');
  const [busy, setBusy] = useState(false);
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const appendMessage = useCallback(
    (entry: MemoryEntry) => {
      context.memory.add(entry);
      setMessages((prev) => [...prev, entry]);
    },
    [context, setMessages]
  );

  const slashCommandHelpers = useMemo(
    () => ({
      context,
      appendMessage,
      setMessages,
      setStatus,
    }),
    [appendMessage, context, setMessages, setStatus]
  );

  const commands = useMemo(() => createSlashCommands(slashCommandHelpers), [slashCommandHelpers]);

  const commandQuery = input.startsWith('/') ? input.slice(1) : '';
  const commandToken = normalizeCommandToken(commandQuery.split(/\s+/)[0] ?? '');

  const filteredCommands = useMemo(() => {
    if (!input.startsWith('/')) return [];
    const term = commandToken;
    if (!term) return commands;

    return commands.filter((command) => {
      const haystack = [
        command.name,
        ...(command.aliases ?? []),
        ...(command.keywords ?? []),
        command.description,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());

      return haystack.some((value) => value.includes(term));
    });
  }, [commands, commandToken, input]);

  useEffect(() => {
    const open = input.startsWith('/');
    setPaletteOpen(open);
    if (!open) {
      setSelectedCommandIndex(0);
    }
  }, [input]);

  useEffect(() => {
    if (!isPaletteOpen) return;
    setSelectedCommandIndex((current) => {
      if (filteredCommands.length === 0) {
        return 0;
      }
      return Math.min(current, filteredCommands.length - 1);
    });
  }, [filteredCommands.length, isPaletteOpen]);

  useInput(
    (_, key) => {
      if (!isPaletteOpen || filteredCommands.length === 0) return;
      if (key.downArrow) {
        setSelectedCommandIndex((index) => (index + 1) % filteredCommands.length);
      } else if (key.upArrow) {
        setSelectedCommandIndex((index) => (index - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (key.tab) {
        const selected = filteredCommands[selectedCommandIndex] ?? filteredCommands[0];
        if (selected) {
          setInput(`/${selected.name} `);
        }
      }
    },
    { isActive: isPaletteOpen }
  );

  const runCommand = useCallback(
    async (command: SlashCommand, args: string[], rawInput: string) => {
      setBusy(true);
      const previousStatus = status;
      setStatus(`Running /${command.name}`);
      try {
        await command.run({
          context,
          appendMessage,
          setMessages,
          setStatus,
          args,
          rawInput,
        });
        if (!command.preserveStatus) {
          setStatus('Ready');
        }
      } catch (error) {
        const message = (error as Error).message;
        appendMessage({
          role: 'system',
          content: `Command /${command.name} failed: ${message}`,
          timestamp: Date.now(),
        });
        setStatus('Error');
      } finally {
        setBusy(false);
        if (command.preserveStatus) {
          setStatus(previousStatus);
        }
      }
    },
    [appendMessage, context, setMessages, setStatus, status]
  );

  const resolveCommand = useCallback(
    (
      value: string
    ): { command: SlashCommand | undefined; args: string[] } => {
      if (!value.startsWith('/')) {
        return { command: undefined, args: [] };
      }

      const withoutSlash = value.slice(1).trimStart();
      if (!withoutSlash) {
        const selected = filteredCommands[selectedCommandIndex] ?? filteredCommands[0];
        return { command: selected, args: [] };
      }

      const parts = withoutSlash.trim().split(/\s+/);
      const rawName = parts[0] ?? '';
      const normalized = normalizeCommandToken(rawName);
      const args = parts.slice(1);

      const directMatch = commands.find(
        (command) =>
          command.name === normalized ||
          (command.aliases ?? []).some((alias) => normalizeCommandToken(alias) === normalized)
      );

      if (directMatch) {
        return { command: directMatch, args };
      }

      if (filteredCommands.length === 1) {
        return { command: filteredCommands[0], args };
      }

      const fallback = filteredCommands[selectedCommandIndex] ?? filteredCommands[0];
      return { command: fallback, args };
    },
    [commands, filteredCommands, selectedCommandIndex]
  );

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() || busy) return;

      if (value.startsWith('/')) {
        const { command, args } = resolveCommand(value);
        if (!command) {
          appendMessage({
            role: 'system',
            content: `Unknown command: ${value}`,
            timestamp: Date.now(),
          });
          return;
        }
        await runCommand(command, args, value);
        return;
      }

      setBusy(true);
      appendMessage({ role: 'user', content: value, timestamp: Date.now() });
      setStatus('Processing...');

      try {
        const response = await context.assistant.handleMessage(value);
        appendMessage({ role: 'assistant', content: response, timestamp: Date.now() });
        setStatus('Ready');
      } catch (error) {
        const message = (error as Error).message;
        appendMessage({ role: 'assistant', content: `Error: ${message}`, timestamp: Date.now() });
        setStatus('Error');
      } finally {
        setBusy(false);
      }
    },
    [appendMessage, busy, context.assistant, resolveCommand, runCommand]
  );

  return (
    <Box flexDirection="column" height="100%">
      <Box paddingX={1} paddingY={0} justifyContent="space-between">
        <Text color="cyan">ASIA</Text>
        <Text color={busy ? 'yellow' : 'gray'}>{status}</Text>
      </Box>
      <ChatView messages={messages} />
      <Box flexDirection="column">
        <InputBar value={input} onChange={setInput} onSubmit={handleSubmit} placeholder="Type a request" />
        {isPaletteOpen && (
          <CommandPalette
            commands={filteredCommands}
            selectedIndex={selectedCommandIndex}
            query={commandQuery.trim()}
          />
        )}
      </Box>
      <Box paddingX={1} paddingY={0}>
        <Text color="gray">Press Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};

