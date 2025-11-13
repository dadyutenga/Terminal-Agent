import React, { useState } from 'react';
import { Box, Text } from 'ink';
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

