import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import type { ProviderId } from '../../ai/types.js';

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  requiresApiKey: boolean;
};

export type ProviderSelectorProps = {
  providers: ProviderInfo[];
  currentProvider: ProviderId;
  onSelect: (providerId: ProviderId, apiKey?: string) => void;
  onCancel: () => void;
};

type ControlledTextInputProps = React.ComponentProps<typeof TextInput> & { value?: string };
const ControlledTextInput = TextInput as unknown as React.FC<ControlledTextInputProps>;

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  currentProvider,
  onSelect,
  onCancel,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const index = providers.findIndex((p) => p.id === currentProvider);
    return index >= 0 ? index : 0;
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const selectedProvider = providers[selectedIndex];

  useInput(
    (input, key) => {
      if (showApiKeyInput) return; // Let TextInput handle input

      if (key.escape) {
        onCancel();
      } else if (key.return) {
        if (selectedProvider?.requiresApiKey) {
          setShowApiKeyInput(true);
        } else {
          onSelect(selectedProvider?.id || currentProvider);
        }
      } else if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : providers.length - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => (prev < providers.length - 1 ? prev + 1 : 0));
      }
    },
    { isActive: !showApiKeyInput }
  );

  const handleApiKeySubmit = () => {
    if (selectedProvider) {
      onSelect(selectedProvider.id, apiKey.trim() || undefined);
    }
  };

  const handleApiKeyCancel = () => {
    setShowApiKeyInput(false);
    setApiKey('');
  };

  useInput(
    (input, key) => {
      if (key.escape) {
        handleApiKeyCancel();
      }
    },
    { isActive: showApiKeyInput }
  );

  if (showApiKeyInput) {
    return (
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor="yellow"
        padding={1}
        width="80%"
        alignSelf="center"
      >
        <Box marginBottom={1}>
          <Text bold color="yellow">
            🔑 Enter API Key for {selectedProvider?.label}
          </Text>
        </Box>
        <Box borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
          <Text color="yellow">🔐 </Text>
          <ControlledTextInput
            value={apiKey}
            placeholder="Enter your API key..."
            onChange={setApiKey}
            onSubmit={handleApiKeySubmit}
          />
        </Box>
        <Box borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color="gray">
            Enter to Confirm • Esc to Cancel • Leave empty to skip
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="magenta"
      padding={1}
      width="80%"
      alignSelf="center"
    >
      <Box marginBottom={1}>
        <Text bold color="magenta">
          🌐 Select AI Provider
        </Text>
      </Box>
      <Box flexDirection="column" marginBottom={1}>
        {providers.map((provider, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = provider.id === currentProvider;
          return (
            <Box key={provider.id} marginY={0}>
              <Text
                color={isSelected ? 'black' : isCurrent ? 'green' : 'white'}
                backgroundColor={isSelected ? 'magenta' : undefined}
                bold={isCurrent}
              >
                {isSelected ? '❯ ' : '  '}
                {provider.label}
                {provider.requiresApiKey ? ' 🔑' : ''}
                {isCurrent ? ' ✓' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          ↑/↓ Navigate • Enter to Select • Esc to Cancel • 🔑 = Requires API Key
        </Text>
      </Box>
    </Box>
  );
};
