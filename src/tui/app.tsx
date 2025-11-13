import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { v4 as uuid } from 'uuid';
import { ChatView } from './components/ChatView.js';
import { InputBar } from './components/InputBar.js';
import type { RuntimeContext } from '../services/context.js';
import type { MemoryEntry } from '../memory/session-memory.js';

export type TermiMindAppProps = {
  context: RuntimeContext;
};

export const TermiMindApp: React.FC<TermiMindAppProps> = ({ context }) => {
  const [messages, setMessages] = useState<MemoryEntry[]>(context.memory.list());
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string>('Ready');
  const [busy, setBusy] = useState(false);

  const appendMessage = (entry: MemoryEntry) => {
    context.memory.add(entry);
    setMessages((prev) => [...prev, entry]);
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim() || busy) return;
    setBusy(true);
    appendMessage({ role: 'user', content: value, timestamp: Date.now() });
    setInput('');
    setStatus('Processing...');

    try {
      const intent = context.intents.parse(value);
      let response = '';

      switch (intent.type) {
        case 'run': {
          const command = intent.arguments?.command ?? value;
          const result = await context.executor.run(command);
          response = formatCommandResult(result.stdout, result.stderr, result.exitCode);
          break;
        }
        case 'git': {
          const statusInfo = context.git.status();
          response = [
            `Branch: ${statusInfo.branch}`,
            `Ahead: ${statusInfo.ahead}, Behind: ${statusInfo.behind}`,
            statusInfo.changes.length ? 'Changes:' : 'No pending changes.',
            ...statusInfo.changes,
          ]
            .filter(Boolean)
            .join('\n');
          break;
        }
        case 'create-file': {
          const targetPath = intent.arguments?.path ?? `notes/${uuid()}.md`;
          context.patches.writeFile(targetPath, '');
          response = `Created file ${targetPath}`;
          break;
        }
        case 'explain':
        case 'refactor':
        case 'unknown':
        default: {
          const contextSnippets = context.indexer
            .search(value, 3)
            .map((file) => `File: ${file.path}\n${file.content.slice(0, 400)}`)
            .join('\n\n');

          const llmResponse = await context.llm.chat([
            {
              role: 'system',
              content:
                'You are TermiMind, a TypeScript-focused terminal coding assistant. Provide concise answers with actionable steps.',
            },
            ...context.memory.list().slice(-10).map(({ role, content }) => ({ role, content })),
            { role: 'user', content: `${value}\n\nContext:\n${contextSnippets}` },
          ]);
          response = llmResponse.content.trim() || 'No response from language model.';
        }
      }

      appendMessage({ role: 'assistant', content: response, timestamp: Date.now() });
      setStatus('Ready');
    } catch (error) {
      const message = (error as Error).message;
      appendMessage({ role: 'assistant', content: `Error: ${message}`, timestamp: Date.now() });
      setStatus('Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box paddingX={1} paddingY={0} justifyContent="space-between">
        <Text color="cyan">TermiMind</Text>
        <Text color={busy ? 'yellow' : 'gray'}>{status}</Text>
      </Box>
      <ChatView messages={messages} />
      <InputBar value={input} onChange={setInput} onSubmit={handleSubmit} placeholder="Type a request" />
      <Box paddingX={1} paddingY={0}>
        <Text color="gray">Press Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};

const formatCommandResult = (stdout: string, stderr: string, exitCode: number | null): string => {
  const parts = [stdout.trim(), stderr.trim() ? `stderr:\n${stderr.trim()}` : '', `exit code: ${exitCode}`];
  return parts.filter(Boolean).join('\n\n');
};
