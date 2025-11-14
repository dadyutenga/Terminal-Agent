import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';

interface ApprovalPromptProps {
  question: string;
  onApprove: () => void;
  onReject: () => void;
  dangerLevel?: 'safe' | 'caution' | 'dangerous';
  requireTypedConfirmation?: boolean; // For dangerous actions
}

/**
 * Component to get user approval before executing actions
 */
export const ApprovalPrompt: React.FC<ApprovalPromptProps> = ({
  question,
  onApprove,
  onReject,
  dangerLevel = 'safe',
  requireTypedConfirmation = false,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [mode, setMode] = useState<'choice' | 'typing'>(
    requireTypedConfirmation ? 'typing' : 'choice',
  );

  useInput((input, key) => {
    if (mode === 'choice') {
      if (input === 'y' || input === 'Y') {
        if (requireTypedConfirmation) {
          setMode('typing');
        } else {
          onApprove();
        }
      } else if (input === 'n' || input === 'N' || key.escape) {
        onReject();
      }
    }
  });

  const handleSubmit = () => {
    if (confirmText.toLowerCase() === 'yes') {
      onApprove();
    } else {
      onReject();
    }
  };

  const getDangerColor = () => {
    switch (dangerLevel) {
      case 'safe':
        return 'green';
      case 'caution':
        return 'yellow';
      case 'dangerous':
        return 'red';
    }
  };

  const getDangerEmoji = () => {
    switch (dangerLevel) {
      case 'safe':
        return '✅';
      case 'caution':
        return '⚠️';
      case 'dangerous':
        return '🚨';
    }
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box marginBottom={1}>
        <Text color={getDangerColor()} bold>
          {getDangerEmoji()} {question}
        </Text>
      </Box>

      {mode === 'typing' ? (
        <Box flexDirection="column">
          <Text color="red" bold>
            ⚠️ DANGEROUS ACTION - Type "yes" to confirm:
          </Text>
          <Box marginTop={1}>
            <Text color="cyan">» </Text>
            <TextInput
              onChange={setConfirmText}
              onSubmit={handleSubmit}
              placeholder="Type 'yes' to confirm..."
            />
          </Box>
        </Box>
      ) : (
        <Box flexDirection="row" gap={2}>
          <Text>
            <Text color="green">[Y]</Text>es
          </Text>
          <Text>
            <Text color="red">[N]</Text>o
          </Text>
          {requireTypedConfirmation && dangerLevel === 'dangerous' && (
            <Text color="yellow"> (Will require typed confirmation)</Text>
          )}
        </Box>
      )}
    </Box>
  );
};
