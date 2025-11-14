import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export type ModelSelectorProps = {
  models: readonly string[];
  currentModel: string;
  providerName: string;
  onSelect: (model: string) => void;
  onCancel: () => void;
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  currentModel,
  providerName,
  onSelect,
  onCancel,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const index = models.indexOf(currentModel);
    return index >= 0 ? index : 0;
  });

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      onSelect(models[selectedIndex] || currentModel);
    } else if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : models.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < models.length - 1 ? prev + 1 : 0));
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      padding={1}
      width="80%"
      alignSelf="center"
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🎯 Select Model for {providerName}
        </Text>
      </Box>
      <Box flexDirection="column" marginBottom={1}>
        {models.map((model, index) => {
          const isSelected = index === selectedIndex;
          const isCurrent = model === currentModel;
          return (
            <Box key={model} marginY={0}>
              <Text
                color={isSelected ? 'black' : isCurrent ? 'green' : 'white'}
                backgroundColor={isSelected ? 'cyan' : undefined}
                bold={isCurrent}
              >
                {isSelected ? '❯ ' : '  '}
                {model}
                {isCurrent ? ' ✓' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          ↑/↓ Navigate • Enter to Select • Esc to Cancel
        </Text>
      </Box>
    </Box>
  );
};
