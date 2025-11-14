import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { MemoryEntry } from '../../memory/session-memory.js';

export type ChatViewProps = {
  messages: MemoryEntry[];
  isProcessing?: boolean;
};

const roleColor: Record<MemoryEntry['role'], string> = {
  system: 'gray',
  user: 'cyan',
  assistant: 'magenta',
};

const roleLabel: Record<MemoryEntry['role'], string> = {
  system: '⚙️  SYSTEM',
  user: '� USER',
  assistant: '🤖 ASIA',
};

const roleBorderColor: Record<MemoryEntry['role'], string> = {
  system: 'gray',
  user: 'cyan',
  assistant: 'magenta',
};

const formatMessage = (content: string) => {
  // Detect code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    // Add code block
    parts.push({ type: 'code', content: match[2], language: match[1] || 'plaintext' });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
};

export const ChatView: React.FC<ChatViewProps> = ({ messages, isProcessing = false }) => {
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      {messages.length === 0 ? (
        <Box flexDirection="column" paddingY={1}>
          <Text color="cyan" bold>
            ✨ Welcome to ASIA! 🚀
          </Text>
          <Text color="gray">Ask me anything about your codebase, and I'll help you out! 💡</Text>
        </Box>
      ) : (
        <>
          {messages.map((message, index) => {
            const messageParts = formatMessage(message.content);
            return (
              <Box key={`${message.timestamp}-${index}`} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text color={roleColor[message.role]} bold>
                    {roleLabel[message.role]}
                  </Text>
                </Box>
                <Box
                  flexDirection="column"
                  borderStyle="round"
                  borderColor={roleBorderColor[message.role]}
                  paddingX={1}
                  paddingY={0}
                  marginTop={0}
                >
                  {messageParts.map((part, partIndex) => {
                    if (part.type === 'code') {
                      return (
                        <Box key={partIndex} flexDirection="column" marginY={0}>
                          <Text color="yellow" dimColor>
                            📝 {'language' in part ? part.language : 'code'}
                          </Text>
                          <Box
                            borderStyle="single"
                            borderColor="yellow"
                            paddingX={1}
                            flexDirection="column"
                          >
                            <Text color="green">{part.content}</Text>
                          </Box>
                        </Box>
                      );
                    }
                    return <Text key={partIndex}>{part.content}</Text>;
                  })}
                </Box>
              </Box>
            );
          })}
          {isProcessing && (
            <Box marginBottom={1}>
              <Text color="magenta">
                <Spinner type="dots" /> ASIA is thinking...
              </Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
