import React from 'react';
import { Box, Text } from 'ink';
import type { ProviderId } from '../../ai/types.js';

export type HeaderProps = {
  provider: ProviderId;
  model: string;
  status: string;
};

/**
 * Isolated header component that ONLY re-renders when provider, model, or status changes.
 * Does NOT re-render on input changes or chat updates.
 */
export const Header = React.memo<HeaderProps>(({ provider, model, status }) => {
  return (
    <Box borderStyle="round" borderColor="magenta" paddingX={1} marginBottom={1}>
      <Text color="magenta" bold>
        🤖 ASIA
      </Text>
      <Text color="gray"> | </Text>
      <Text color="cyan">{provider}</Text>
      <Text color="gray"> • </Text>
      <Text color="yellow">{model}</Text>
      <Text color="gray"> | </Text>
      <Text color={status === 'Ready' ? 'green' : status === 'Error' ? 'red' : 'yellow'}>
        {status}
      </Text>
    </Box>
  );
});

Header.displayName = 'Header';
