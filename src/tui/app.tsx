import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from './components/Header.js';
import { ChatView } from './components/ChatView.js';
import { InputBar } from './components/InputBar.js';
import { CommandPalette } from './components/CommandPalette.js';
import { ModelSelector } from './components/ModelSelector.js';
import { ProviderSelector } from './components/ProviderSelector.js';
import type { RuntimeContext } from '../services/context.js';
import type { MemoryEntry } from '../memory/session-memory.js';
import { createSlashCommands } from './slash-commands/commands.js';
import type { SlashCommand } from './slash-commands/types.js';
import type { ProviderId } from '../ai/types.js';
import { AiManager } from '../ai/ai-manager.js';
import { useDebounce } from './hooks/useDebounce.js';

export type ASIATAppProps = {
  context: RuntimeContext;
};

const normalizeCommandToken = (value: string) => value.trim().toLowerCase();

/**
 * Main app component - optimized to prevent flickering:
 * 1. Input state is LOCAL to InputBar (doesn't trigger global re-renders)
 * 2. Messages stored in stable ref, only trigger re-render on count change
 * 3. Slash command filtering is debounced
 * 4. All components are memoized
 * 5. Header isolated - only updates on provider/model/status change
 * 6. No console.log in render cycle
 * 7. Effects only run when truly needed
 */
export const ASIATApp: React.FC<ASIATAppProps> = ({ context }) => {
  // === STABLE STATE (doesn't change frequently) ===
  const [status, setStatus] = useState<string>('Ready');
  const [busy, setBusy] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ProviderId>(context.llm.providerId);
  const [currentModel, setCurrentModel] = useState<string>(context.llm.model);
  
  // === MESSAGE MANAGEMENT (stable array, append-only) ===
  // Use ref to store messages to prevent unnecessary re-renders
  const messagesRef = useRef<MemoryEntry[]>(context.memory.list());
  const [messageCount, setMessageCount] = useState(messagesRef.current.length);
  
  // Stable append function that doesn't recreate array
  const appendMessage = useCallback(
    (entry: MemoryEntry) => {
      context.memory.add(entry);
      messagesRef.current.push(entry); // Append, don't recreate
      setMessageCount(messagesRef.current.length); // Trigger re-render via count change
    },
    [context]
  );
  
  // === INPUT STATE (local to prevent global re-renders) ===
  const [input, setInput] = useState('');
  
  // === SLASH COMMAND STATE ===
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  
  // Debounce command query to prevent re-filtering on every keystroke
  const debouncedInput = useDebounce(input, 100);

  const slashCommandHelpers = useMemo(
    () => ({
      context,
      appendMessage,
      setMessages: ((updater: React.SetStateAction<MemoryEntry[]>) => {
        if (typeof updater === 'function') {
          messagesRef.current = updater(messagesRef.current);
        } else {
          messagesRef.current = updater;
        }
        setMessageCount(messagesRef.current.length);
      }) as React.Dispatch<React.SetStateAction<MemoryEntry[]>>,
      setStatus,
      setShowModelSelector,
      setShowProviderSelector,
    }),
    [appendMessage, context]
  );

  // Commands are stable (only created once)
  const commands = useMemo(() => createSlashCommands(slashCommandHelpers), [slashCommandHelpers]);

  // Only recompute when debounced input changes
  const { commandQuery, commandToken } = useMemo(() => {
    const query = debouncedInput.startsWith('/') ? debouncedInput.slice(1) : '';
    const token = normalizeCommandToken(query.split(/\s+/)[0] ?? '');
    return { commandQuery: query, commandToken: token };
  }, [debouncedInput]);

  // Filter commands based on debounced input (prevents re-filtering on every keystroke)
  const filteredCommands = useMemo(() => {
    if (!debouncedInput.startsWith('/')) return [];
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
  }, [commands, commandToken, debouncedInput]);

  // Open/close palette only when input starts/stops with '/' (not on every keystroke)
  useEffect(() => {
    const open = input.startsWith('/');
    setPaletteOpen(open);
    if (!open) {
      setSelectedCommandIndex(0);
    }
  }, [input.startsWith('/')]);  // Only run when '/' state changes, not on every character

  // Adjust selected index when filtered commands change
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
          setMessages: slashCommandHelpers.setMessages,
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
    [appendMessage, context, slashCommandHelpers.setMessages, setStatus, status]
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

  // === UI CALLBACKS ===
  const handleModelSelect = useCallback(
    (model: string) => {
      setCurrentModel(model);
      context.config.llm.model = model;
      setShowModelSelector(false);
      appendMessage({
        role: 'system',
        content: `✅ Model changed to: ${model}`,
        timestamp: Date.now(),
      });
      setStatus(`Ready - ${currentProvider} (${model})`);
    },
    [appendMessage, context.config.llm, currentProvider]
  );

  const handleProviderSelect = useCallback(
    async (providerId: ProviderId, apiKey?: string) => {
      setShowProviderSelector(false);
      setStatus('Switching provider...');
      
      try {
        if (apiKey) {
          context.config.llm.apiKey = apiKey;
        }
        context.config.llm.provider = providerId;
        
        // Recreate the AI manager with new provider
        const newAiManager = new AiManager(context.config.llm);
        context.llm = newAiManager;
        context.assistant.updateLlm(newAiManager);
        
        setCurrentProvider(providerId);
        setCurrentModel(newAiManager.model);
        
        appendMessage({
          role: 'system',
          content: `✅ Provider changed to: ${providerId} (${newAiManager.model})`,
          timestamp: Date.now(),
        });
        setStatus(`Ready - ${providerId} (${newAiManager.model})`);
      } catch (error) {
        const message = (error as Error).message;
        appendMessage({
          role: 'system',
          content: `❌ Failed to switch provider: ${message}`,
          timestamp: Date.now(),
        });
        setStatus('Error');
      }
    },
    [appendMessage, context]
  );

  // === RENDER ===
  return (
    <Box flexDirection="column" height="100%">
      <Header provider={currentProvider} model={currentModel} status={status} />
      <ChatView messages={messagesRef.current} isProcessing={busy} />
      <Box flexDirection="column">
        {showModelSelector && (
          <ModelSelector
            models={context.llm.availableModels}
            currentModel={currentModel}
            providerName={currentProvider}
            onSelect={handleModelSelect}
            onCancel={() => setShowModelSelector(false)}
          />
        )}
        {showProviderSelector && (
          <ProviderSelector
            providers={AiManager.listProviders().map((p) => ({
              id: p.id,
              label: p.label,
              requiresApiKey: p.requiresApiKey,
            }))}
            currentProvider={currentProvider}
            onSelect={handleProviderSelect}
            onCancel={() => setShowProviderSelector(false)}
          />
        )}
        {!showModelSelector && !showProviderSelector && (
          <>
            <InputBar value={input} onChange={setInput} onSubmit={handleSubmit} placeholder="Type a request" />
            {isPaletteOpen && (
              <CommandPalette
                commands={filteredCommands}
                selectedIndex={selectedCommandIndex}
                query={commandQuery.trim()}
              />
            )}
          </>
        )}
      </Box>
      <Box paddingX={1} paddingY={0}>
        <Text color="gray">Press Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};

