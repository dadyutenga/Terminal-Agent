import React from 'react';
import { Box, Text } from 'ink';
import type { MemoryEntry } from '../../memory/session-memory.js';

export type ChatViewProps = {
  messages: MemoryEntry[];
};

const roleColor: Record<MemoryEntry['role'], string> = {
  system: 'gray',
  user: 'cyan',
  assistant: 'magenta',
};

export const ChatView: React.FC<ChatViewProps> = ({ messages }) => {
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      {messages.length === 0 ? (
        <Text color="gray">Welcome to TermiMind! Ask me anything about your codebase.</Text>
      ) : (
        messages.map((message, index) => (
          <Box key={`${message.timestamp}-${index}`} flexDirection="column" marginBottom={1}>
            <Text color={roleColor[message.role]}>{`${message.role.toUpperCase()}`}</Text>
            <Text>{message.content}</Text>
          </Box>
        ))
      )}
    </Box>
  );
};
