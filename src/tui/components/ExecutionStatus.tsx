import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ExecutionStatusProps {
  status: 'pending' | 'executing' | 'success' | 'error' | 'cancelled';
  message?: string;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Component to show execution status and progress
 */
export const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  status,
  message,
  currentStep,
  totalSteps,
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          emoji: '⏳',
          color: 'yellow' as const,
          text: 'Pending approval...',
        };
      case 'executing':
        return {
          emoji: <Spinner type="dots" />,
          color: 'cyan' as const,
          text: 'Executing...',
        };
      case 'success':
        return {
          emoji: '✅',
          color: 'green' as const,
          text: 'Success!',
        };
      case 'error':
        return {
          emoji: '❌',
          color: 'red' as const,
          text: 'Error',
        };
      case 'cancelled':
        return {
          emoji: '🚫',
          color: 'gray' as const,
          text: 'Cancelled',
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text color={display.color}>
          {typeof display.emoji === 'string' ? display.emoji : ''}{' '}
        </Text>
        {typeof display.emoji !== 'string' && display.emoji}
        <Text color={display.color} bold>
          {' '}{display.text}
        </Text>
      </Box>

      {message && (
        <Box marginTop={1}>
          <Text>{message}</Text>
        </Box>
      )}

      {currentStep !== undefined && totalSteps !== undefined && (
        <Box marginTop={1}>
          <Text color="cyan">
            Step {currentStep}/{totalSteps}
          </Text>
        </Box>
      )}
    </Box>
  );
};
